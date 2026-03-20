const pool   = require('../db/db');
const crypto = require('crypto');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/* ── helper: check if requester owns the dataset ── */
async function assertOwner(datasetId, userId) {
  const res = await pool.query(
    'SELECT id FROM datasets WHERE id = $1 AND user_id = $2',
    [datasetId, userId]
  );
  return res.rowCount > 0;
}

/* ─────────────────────────────────────────────────────────────
   POST /api/datasets/:id/invite
   Body: { email, role? }
───────────────────────────────────────────────────────────── */
exports.inviteCollaborator = async (req, res) => {
  const datasetId = req.params.id;
  const inviterId = req.user.id;
  const { email, role = 'viewer' } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required.' });
  if (!['viewer', 'editor'].includes(role))
    return res.status(400).json({ error: "role must be 'viewer' or 'editor'." });

  try {
    // Must be the dataset owner to invite
    const isOwner = await assertOwner(datasetId, inviterId);
    if (!isOwner)
      return res.status(403).json({ error: 'Only the dataset owner can invite collaborators.' });

    // Get dataset info
    const dsRes = await pool.query('SELECT name FROM datasets WHERE id = $1', [datasetId]);
    if (dsRes.rowCount === 0) return res.status(404).json({ error: 'Dataset not found.' });
    const datasetName = dsRes.rows[0].name;

    // Get inviter info
    const inviterRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [inviterId]);
    const inviter = inviterRes.rows[0];

    // Find or handle invited user (they may not have an account yet)
    const inviteeRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const inviteeId = inviteeRes.rows[0]?.id || null;

    if (inviteeId) {
      // Don't invite the owner themselves
      if (inviteeId === inviterId)
        return res.status(400).json({ error: 'You cannot invite yourself.' });

      // Check if already a collaborator
      const existing = await pool.query(
        'SELECT id, status FROM dataset_collaborators WHERE dataset_id = $1 AND user_id = $2',
        [datasetId, inviteeId]
      );
      if (existing.rowCount > 0 && existing.rows[0].status === 'accepted')
        return res.status(400).json({ error: 'This user is already a collaborator.' });
    }

    // Generate secure invite token
    const token = crypto.randomBytes(32).toString('hex');

    // Upsert invite record (handles re-invites gracefully)
    if (inviteeId) {
      await pool.query(
        `INSERT INTO dataset_collaborators (dataset_id, user_id, invited_by, role, status, invite_token)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         ON CONFLICT (dataset_id, user_id)
         DO UPDATE SET role = EXCLUDED.role, status = 'pending', invite_token = EXCLUDED.invite_token`,
        [datasetId, inviteeId, inviterId, role, token]
      );
    } else {
      // Store as pending without user_id (they'll be linked when they sign up & accept)
      await pool.query(
        `INSERT INTO dataset_collaborators (dataset_id, invited_by, role, status, invite_token)
         VALUES ($1, $2, $3, 'pending', $4)`,
        [datasetId, inviterId, role, token]
      );
    }

    // Determine base URL for invite link
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/invite/accept/${token}`;

    // Send invite email via Resend
    await resend.emails.send({
      from: 'LuminaBI <onboarding@resend.dev>',
      to: email,
      reply_to: inviter.email,
      subject: `${inviter.name} invited you to collaborate on "${datasetName}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">LuminaBI — Team Invite</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:15px;color:#374151">
              <strong>${inviter.name}</strong> (${inviter.email}) has invited you to collaborate on the
              <strong>"${datasetName}"</strong> dataset in LuminaBI.
            </p>
            <p style="font-size:13px;color:#6b7280">Your role: <strong>${role}</strong></p>
            <a href="${inviteLink}"
               style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
              Accept Invitation →
            </a>
            <p style="margin-top:24px;font-size:12px;color:#9ca3af">
              This link expires in 7 days. If you don't have a LuminaBI account, you'll be prompted to create one first.
            </p>
          </div>
        </div>
      `
    });

    res.status(200).json({ message: `Invite sent to ${email} successfully.` });

  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Failed to send invite.' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/invite/accept/:token
   Called when invited user clicks the email link (they must be logged in)
───────────────────────────────────────────────────────────── */
exports.acceptInvite = async (req, res) => {
  const { token } = req.params;
  const userId    = req.user.id;

  try {
    // Find the pending invite
    const inviteRes = await pool.query(
      `SELECT * FROM dataset_collaborators WHERE invite_token = $1 AND status = 'pending'`,
      [token]
    );

    if (inviteRes.rowCount === 0)
      return res.status(404).json({ error: 'Invite not found or already accepted.' });

    const invite = inviteRes.rows[0];

    // Link the invite to this user (handles case where user wasn't registered when invited)
    await pool.query(
      `UPDATE dataset_collaborators
       SET user_id = $1, status = 'accepted', invite_token = NULL
       WHERE id = $2`,
      [userId, invite.id]
    );

    // Fetch the dataset info to redirect properly
    const dsRes = await pool.query(
      'SELECT id, name FROM datasets WHERE id = $1',
      [invite.dataset_id]
    );
    const dataset = dsRes.rows[0];

    res.json({
      message: 'You have joined the workspace!',
      dataset: { id: dataset.id, name: dataset.name },
    });

  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to accept invite.' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/datasets/:id/collaborators
───────────────────────────────────────────────────────────── */
exports.getCollaborators = async (req, res) => {
  const datasetId = req.params.id;
  const userId    = req.user.id;

  try {
    // Must be owner or collaborator to view
    const ds = await pool.query('SELECT user_id FROM datasets WHERE id = $1', [datasetId]);
    if (ds.rowCount === 0) return res.status(404).json({ error: 'Dataset not found.' });

    const isOwner = ds.rows[0].user_id === userId;
    if (!isOwner) {
      const isMember = await pool.query(
        `SELECT id FROM dataset_collaborators WHERE dataset_id=$1 AND user_id=$2 AND status='accepted'`,
        [datasetId, userId]
      );
      if (isMember.rowCount === 0)
        return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await pool.query(
      `SELECT dc.id, dc.role, dc.status, dc.created_at,
              u.id  AS user_id,
              u.name AS user_name,
              u.email AS user_email,
              inv.name AS invited_by_name
       FROM   dataset_collaborators dc
       LEFT JOIN users u   ON u.id  = dc.user_id
       LEFT JOIN users inv ON inv.id = dc.invited_by
       WHERE  dc.dataset_id = $1
       ORDER  BY dc.created_at ASC`,
      [datasetId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get collaborators error:', err);
    res.status(500).json({ error: 'Failed to fetch collaborators.' });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/datasets/:id/collaborators/:collabId
   Owner can remove anyone; collaborator can remove themselves
───────────────────────────────────────────────────────────── */
exports.removeCollaborator = async (req, res) => {
  const { id: datasetId, collabId } = req.params;
  const userId = req.user.id;

  try {
    const isOwner = await assertOwner(datasetId, userId);

    if (isOwner) {
      // Owner can remove anyone
      const r = await pool.query(
        'DELETE FROM dataset_collaborators WHERE id = $1 AND dataset_id = $2 RETURNING id',
        [collabId, datasetId]
      );
      if (r.rowCount === 0) return res.status(404).json({ error: 'Collaborator not found.' });
    } else {
      // Non-owner can only remove themselves
      const r = await pool.query(
        'DELETE FROM dataset_collaborators WHERE id = $1 AND dataset_id = $2 AND user_id = $3 RETURNING id',
        [collabId, datasetId, userId]
      );
      if (r.rowCount === 0) return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ message: 'Collaborator removed.' });
  } catch (err) {
    console.error('Remove collaborator error:', err);
    res.status(500).json({ error: 'Failed to remove collaborator.' });
  }
};
