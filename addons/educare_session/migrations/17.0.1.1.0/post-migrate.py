"""
Migration 17.0.1.1.0 — Force recompute datetime_start / datetime_stop.

Background: The timezone source in _compute_session_datetimes was changed from
env.user.tz (unreliable in server context) to env.company.partner_id.tz.
Existing stored values were computed with the old logic and may be offset by
+7 hours (UTC vs Asia/Ho_Chi_Minh). This migration invalidates all stored
datetime_start / datetime_stop values so Odoo recomputes them correctly.
"""

import logging

_logger = logging.getLogger(__name__)


def migrate(cr, installed_version):
    from odoo import api, SUPERUSER_ID

    env = api.Environment(cr, SUPERUSER_ID, {})
    sessions = env["educare.session.log"].search([])
    if not sessions:
        _logger.info("post-migrate 17.0.1.1.0: no session records found, skipping.")
        return

    _logger.info(
        "post-migrate 17.0.1.1.0: recomputing datetime_start/datetime_stop for %d sessions.",
        len(sessions),
    )
    sessions._compute_session_datetimes()
    _logger.info("post-migrate 17.0.1.1.0: done.")
