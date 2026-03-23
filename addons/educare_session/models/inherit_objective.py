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
        'session_result_ids.accuracy_pct',
        'session_result_ids.total_trials',
        'session_result_ids.session_id.status',
    )
    def _compute_accuracy(self):
        """Current accuracy = average of last 3 reviewed session results."""
        Result = self.env['educare.session.result']
        for obj in self:
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('total_trials', '>', 0),
            ], order='session_date desc, id desc', limit=3)
            if results:
                obj.current_accuracy_pct = sum(results.mapped('accuracy_pct')) / len(results)
            else:
                obj.current_accuracy_pct = 0.0

    @api.depends(
        'session_result_ids.accuracy_pct',
        'session_result_ids.total_trials',
        'session_result_ids.session_id.status',
        'target_accuracy_pct',
    )
    def _compute_consecutive(self):
        """Count consecutive reviewed sessions meeting target accuracy (most recent first)."""
        Result = self.env['educare.session.result']
        for obj in self:
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('total_trials', '>', 0),
            ], order='session_date desc, id desc')
            consecutive = 0
            for r in results:
                if r.accuracy_pct >= obj.target_accuracy_pct:
                    consecutive += 1
                else:
                    break
            obj.consecutive_sessions_achieved = consecutive

    @api.depends(
        'session_result_ids.accuracy_pct',
        'session_result_ids.total_trials',
        'session_result_ids.session_id.status',
    )
    def _compute_trend(self):
        """Analyze progress trend from reviewed session history."""
        Result = self.env['educare.session.result']
        for obj in self:
            results = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('total_trials', '>', 0),
            ], order='session_date asc, id asc')
            if len(results) < 4:
                obj.trend = 'insufficient_data'
                continue
            mid = len(results) // 2
            first_avg = sum(results[:mid].mapped('accuracy_pct')) / mid
            second_avg = sum(results[mid:].mapped('accuracy_pct')) / (len(results) - mid)
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
        'session_result_ids.accuracy_pct',
        'session_result_ids.total_trials',
        'session_result_ids.session_id.status',
    )
    def _compute_last_session(self):
        """Get most recent reviewed session data."""
        Result = self.env['educare.session.result']
        for obj in self:
            result = Result.search([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('total_trials', '>', 0),
            ], order='session_date desc, id desc', limit=1)
            if result:
                obj.last_session_date = result.session_id.session_date
                obj.last_session_accuracy = result.accuracy_pct
            else:
                obj.last_session_date = False
                obj.last_session_accuracy = 0.0

    @api.depends(
        'session_result_ids.total_trials',
        'session_result_ids.session_id.status',
    )
    def _compute_session_count(self):
        """Count total reviewed sessions worked."""
        Result = self.env['educare.session.result']
        for obj in self:
            obj.total_sessions_worked = Result.search_count([
                ('objective_id', '=', obj.id),
                ('session_id.status', '=', 'done'),
                ('total_trials', '>', 0),
            ])
