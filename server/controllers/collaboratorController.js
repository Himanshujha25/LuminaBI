const pool = require('../db/db');
const crypto = require('crypto');

// ──────────────────────────────────────────────
// POST /api/collaborators/invite
// Body: { dataset_id, collaborator_email, role }
// ──────────────────────────────────────────────
const inviteCollaborator = async (req, res) => {
  const owner_id = req.user.id;
  const { dataset_id, collaborator_email, role } = req.body;

  // --- Validate inputs ---
  if (!dataset_id || !collaborator_email || !role) {
    return res.status(400).json({ error: 'dataset_id, collaborator_email, and role are required.' });
  }
  if (!['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'role must be "viewer" or "editor".' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(collaborator_email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // --- Verify dataset ownership ---
    const datasetResult = await pool.query(
      'SELECT id, user_id, name FROM datasets WHERE id = $1',
      [dataset_id]
    );
    if (datasetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }
    const dataset = datasetResult.rows[0];
    if (dataset.user_id !== owner_id) {
      return res.status(403).json({ error: 'Only the dataset owner can invite collaborators.' });
    }

    // --- Prevent self-invite ---
    const ownerResult = await pool.query('SELECT email FROM users WHERE id = $1', [owner_id]);
    if (ownerResult.rows[0]?.email === collaborator_email) {
      return res.status(400).json({ error: 'You cannot invite yourself.' });
    }

    // --- Prevent duplicate pending invite ---
    const existing = await pool.query(
      `SELECT id, status FROM dataset_collaborators
       WHERE dataset_id = $1 AND collaborator_email = $2`,
      [dataset_id, collaborator_email]
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].status === 'accepted') {
        return res.status(409).json({ error: 'This user is already a collaborator.' });
      }
      // Re-send invite (update token + role)
      const newToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `UPDATE dataset_collaborators
         SET role = $1, invite_token = $2, status = 'pending', created_at = NOW()
         WHERE id = $3`,
        [role, newToken, existing.rows[0].id]
      );
      return res.status(200).json({
        message: 'Invite re-sent successfully.',
        invite_token: newToken,
      });
    }

    // --- Create new invite ---
    const invite_token = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      `INSERT INTO dataset_collaborators
         (dataset_id, owner_id, collaborator_email, role, invite_token, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, invite_token`,
      [dataset_id, owner_id, collaborator_email, role, invite_token]
    );

    return res.status(201).json({
      message: `Invitation sent to ${collaborator_email}.`,
      invite_token: result.rows[0].invite_token,
      collaborator_id: result.rows[0].id,
    });
  } catch (err) {
    console.error('[inviteCollaborator]', err);
    return res.status(500).json({ error: 'Server error while sending invite.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/collaborators/accept/:token
// ──────────────────────────────────────────────
const acceptInvite = async (req, res) => {
  const { token } = req.params;
  const user_id = req.user?.id || null;

  try {
    const result = await pool.query(
      `SELECT dc.*, d.name AS dataset_name, u.email AS owner_email
       FROM dataset_collaborators dc
       JOIN datasets d ON d.id = dc.dataset_id
       JOIN users u ON u.id = dc.owner_id
       WHERE dc.invite_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite link.' });
    }

    const invite = result.rows[0];

    if (invite.status === 'accepted') {
      return res.status(200).json({
        message: 'You already have access to this dataset.',
        dataset_id: invite.dataset_id,
        dataset_name: invite.dataset_name,
        role: invite.role,
        already_accepted: true,
      });
    }

    // If user is logged in, verify email matches
    if (user_id) {
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
      const userEmail = userResult.rows[0]?.email;
      if (userEmail && userEmail !== invite.collaborator_email) {
        return res.status(403).json({
          error: `This invite is for ${invite.collaborator_email}. You are logged in as ${userEmail}.`,
        });
      }
    }

    // Accept the invite
    await pool.query(
      `UPDATE dataset_collaborators SET status = 'accepted' WHERE invite_token = $1`,
      [token]
    );

    return res.status(200).json({
      message: `You now have ${invite.role} access to "${invite.dataset_name}".`,
      dataset_id: invite.dataset_id,
      dataset_name: invite.dataset_name,
      role: invite.role,
      owner_email: invite.owner_email,
    });
  } catch (err) {
    console.error('[acceptInvite]', err);
    return res.status(500).json({ error: 'Server error while accepting invite.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/collaborators/shared
// Returns datasets shared with the logged-in user
// ──────────────────────────────────────────────
const getSharedDatasets = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Get email of logged-in user
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
    const userEmail = userResult.rows[0]?.email;
    if (!userEmail) return res.status(401).json({ error: 'User not found.' });

    const result = await pool.query(
      `SELECT
         dc.id            AS collab_id,
         dc.role,
         dc.status,
         dc.created_at   AS invited_at,
         d.id            AS dataset_id,
         d.name          AS dataset_name,
         d.columns,
         d.created_at    AS dataset_created_at,
         u.name          AS owner_name,
         u.email         AS owner_email
       FROM dataset_collaborators dc
       JOIN datasets d ON d.id = dc.dataset_id
       JOIN users u ON u.id = dc.owner_id
       WHERE dc.collaborator_email = $1
         AND dc.status = 'accepted'
       ORDER BY dc.created_at DESC`,
      [userEmail]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getSharedDatasets]', err);
    return res.status(500).json({ error: 'Server error while fetching shared datasets.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/collaborators/dataset/:datasetId
// Returns collaborators for a specific dataset (owner only)
// ──────────────────────────────────────────────
const getDatasetCollaborators = async (req, res) => {
  const owner_id = req.user.id;
  const { datasetId } = req.params;

  try {
    // Verify ownership
    const datasetResult = await pool.query(
      'SELECT id FROM datasets WHERE id = $1 AND user_id = $2',
      [datasetId, owner_id]
    );
    if (datasetResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied or dataset not found.' });
    }

    const result = await pool.query(
      `SELECT id, collaborator_email, role, status, created_at
       FROM dataset_collaborators
       WHERE dataset_id = $1
       ORDER BY created_at DESC`,
      [datasetId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getDatasetCollaborators]', err);
    return res.status(500).json({ error: 'Server error while fetching collaborators.' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/collaborators/:collaboratorId
// Remove a collaborator (owner only)
// ──────────────────────────────────────────────
const removeCollaborator = async (req, res) => {
  const owner_id = req.user.id;
  const { collaboratorId } = req.params;

  try {
    // Verify the owner owns the dataset this collaborator belongs to
    const result = await pool.query(
      `DELETE FROM dataset_collaborators
       WHERE id = $1 AND owner_id = $2
       RETURNING id`,
      [collaboratorId, owner_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to remove this collaborator.' });
    }

    return res.status(200).json({ message: 'Collaborator removed successfully.' });
  } catch (err) {
    console.error('[removeCollaborator]', err);
    return res.status(500).json({ error: 'Server error while removing collaborator.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/collaborators/invite-info/:token
// Peek at invite info WITHOUT accepting (for the Accept page)
// ──────────────────────────────────────────────
const getInviteInfo = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query(
      `SELECT dc.collaborator_email, dc.role, dc.status,
              d.name AS dataset_name,
              u.name AS owner_name, u.email AS owner_email
       FROM dataset_collaborators dc
       JOIN datasets d ON d.id = dc.dataset_id
       JOIN users u ON u.id = dc.owner_id
       WHERE dc.invite_token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite link.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('[getInviteInfo]', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  inviteCollaborator,
  acceptInvite,
  getSharedDatasets,
  getDatasetCollaborators,
  removeCollaborator,
  getInviteInfo,
};
