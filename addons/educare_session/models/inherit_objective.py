from odoo import api, fields, models


class EducareIepObjectiveSession(models.Model):
    """Extend IEP Objective with session result relationships and live computed fields."""
    _inherit = 'educare.iep.objective'

    session_result_ids = fields.One2many(
        'educare.session.result',
        'objective_id',
        string='Session Results',
    )

    # ── Override placeholder computed fields with real session data ──

    @api.depends(
        'session_result_ids.score_pct',
        'session_result_ids.is_recorded',
        'session_result_ids.session_id.status',
        'session_result_ids.result_phase',
        'status',
        'locked_accuracy_pct',
    )
    def _compute_accuracy(self):
        """Current accuracy from intervention sessions only.
        Frozen at locked_accuracy_pct once objective is mastered."""
        Result = self.env['educare.session.result']
        for obj in self:
            if obj.status == 'mastered':
                obj.current_accuracy_pct = obj.locked_accuracy_pct
                continue
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('result_phase', '=', 'intervention'),
                ('is_recorded', '=', True),
            ], order='session_date desc, id desc', limit=3)
            if results:
                obj.current_accuracy_pct = sum(results.mapped('score_pct')) / len(results)
            else:
                obj.current_accuracy_pct = 0.0

    @api.depends(
        'session_result_ids.score_pct',
        'session_result_ids.is_recorded',
        'session_result_ids.session_id.status',
        'session_result_ids.result_phase',
        'target_accuracy_pct',
        'status',
    )
    def _compute_consecutive(self):
        """Count consecutive intervention sessions achieving mastery.
        Frozen once objective is mastered (only intervention sessions count)."""
        Result = self.env['educare.session.result']
        for obj in self:
            if obj.status == 'mastered':
                # Keep stored value — don't recompute from maintenance sessions
                continue
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('result_phase', '=', 'intervention'),
                ('is_recorded', '=', True),
            ], order='session_date desc, id desc')
            consecutive = 0
            for r in results:
                if r.mastery_achieved:
                    consecutive += 1
                else:
                    break
            obj.consecutive_sessions_achieved = consecutive

    @api.depends(
        'session_result_ids.score_pct',
        'session_result_ids.is_recorded',
        'session_result_ids.session_id.status',
        'session_result_ids.result_phase',
        'status',
    )
    def _compute_trend(self):
        """Analyze progress trend from intervention sessions only.
        Frozen once objective is mastered."""
        Result = self.env['educare.session.result']
        for obj in self:
            if obj.status == 'mastered':
                # Keep stored value — trend is frozen at mastery
                continue
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('result_phase', '=', 'intervention'),
                ('is_recorded', '=', True),
            ], order='session_date asc, id asc')
            if len(results) < 4:
                obj.trend = 'insufficient_data'
                continue
            mid = len(results) // 2
            first_avg = sum(results[:mid].mapped('score_pct')) / mid
            second_avg = sum(results[mid:].mapped('score_pct')) / (len(results) - mid)
            diff = second_avg - first_avg
            if diff > 5:
                obj.trend = 'improving'
            elif diff < -5:
                obj.trend = 'declining'
            elif obj.current_accuracy_pct < obj.target_accuracy_pct * 0.8:
                obj.trend = 'stagnant'
            else:
                obj.trend = 'stable'

    @api.depends(
        'session_result_ids.session_id.session_date',
        'session_result_ids.score_pct',
        'session_result_ids.is_recorded',
        'session_result_ids.session_id.status',
        'session_result_ids.result_phase',
    )
    def _compute_last_session(self):
        """Most recent intervention session (before mastery) for display."""
        Result = self.env['educare.session.result']
        for obj in self:
            result = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('result_phase', '=', 'intervention'),
                ('is_recorded', '=', True),
            ], order='session_date desc, id desc', limit=1)
            if result:
                obj.last_session_date = result.session_id.session_date
                obj.last_session_accuracy = result.score_pct
            else:
                obj.last_session_date = False
                obj.last_session_accuracy = 0.0

    @api.depends(
        'session_result_ids.is_recorded',
        'session_result_ids.session_id.status',
    )
    def _compute_session_count(self):
        """Count total reviewed sessions — both intervention and maintenance."""
        Result = self.env['educare.session.result']
        for obj in self:
            obj.total_sessions_worked = Result.search_count([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('is_recorded', '=', True),
            ])

    def write(self, vals):
        res = super().write(vals)
        if "status" in vals:
            # When an objective's status changes (e.g. → mastered), re-stamp
            # session_purpose for any live (not yet done) sessions that include it.
            # Done sessions are intentionally skipped — their purpose is frozen.
            sessions = self.env["educare.session.log"].search([
                ("objective_ids", "in", self.ids),
                ("status", "not in", ["done", "cancelled"]),
            ])
            if sessions:
                sessions._stamp_session_purpose()
        return res
