from odoo import _, api, fields, models


class GenerateReportWizard(models.TransientModel):
    _name = 'educare.generate.report.wizard'
    _description = 'Generate Daily Report from Session'

    session_log_id = fields.Many2one(
        'educare.session.log',
        string='Session',
        required=True,
        readonly=True,
    )
    student_id = fields.Many2one(
        'educare.student',
        related='session_log_id.student_id',
        string='Student',
        readonly=True,
    )
    report_date = fields.Date(
        string='Report Date',
        default=fields.Date.today,
    )
    activity_summary = fields.Text(
        string='What did we do today?',
    )
    achievements = fields.Text(
        string='What did the child achieve?',
    )
    parent_action_guide = fields.Text(
        string='What can parents do at home?',
    )
    teacher_note = fields.Text(
        string='Personal note from teacher',
    )

    def _get_achievement_signal(self, result_line):
        """Return positive signal key or False for neutral/low outcomes."""
        if result_line.mastery_achieved:
            return 'mastered'

        # Baseline records are for measurement, not parent-facing achievement claims.
        if result_line.phase == 'baseline':
            return False

        baseline = result_line.objective_id.baseline_accuracy_pct or 0.0
        # Positive progress = meaningful gain from baseline with enough performance level.
        if result_line.accuracy_pct >= max(60.0, baseline + 10.0):
            return 'progress'
        return False

    @api.model
    def default_get(self, fields_list):
        res = super().default_get(fields_list)
        session_id = self.env.context.get('active_id')
        if session_id:
            session = self.env['educare.session.log'].browse(session_id)
            if session.exists():
                res['session_log_id'] = session.id
                res['report_date'] = session.session_date
                results = session.result_line_ids
                if results:
                    obj_names = results.mapped('objective_id.name')
                    if obj_names:
                        res['activity_summary'] = _(
                            "Today we worked on %(count)s objective(s): %(objectives)s.",
                            count=len(obj_names),
                            objectives=', '.join(obj_names),
                        )

                    reviewed_lines = results.filtered(lambda r: r.total_trials > 0)
                    if reviewed_lines:
                        mastered = []
                        progressing = []
                        for line in reviewed_lines:
                            if not line.objective_id or not line.objective_id.name:
                                continue
                            signal = self._get_achievement_signal(line)
                            if signal == 'mastered':
                                mastered.append(line.objective_id.name)
                            elif signal == 'progress':
                                progressing.append(line.objective_id.name)

                        parts = []
                        if mastered:
                            parts.append(_(
                                "Mastered today: %(objectives)s",
                                objectives=', '.join(mastered),
                            ))
                        if progressing:
                            parts.append(_(
                                "Showing positive progress: %(objectives)s",
                                objectives=', '.join(progressing),
                            ))

                        # If there is no positive signal, keep blank for manual teacher note.
                        if parts:
                            res['achievements'] = ' | '.join(parts) + '.'
        return res

    def action_generate_report(self):
        self.ensure_one()
        report = self.env['educare.daily.report'].create({
            'session_log_id': self.session_log_id.id,
            'student_id': self.student_id.id,
            'report_date': self.report_date,
            'activity_summary': self.activity_summary,
            'achievements': self.achievements,
            'parent_action_guide': self.parent_action_guide,
            'teacher_note': self.teacher_note,
        })
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'educare.daily.report',
            'res_id': report.id,
            'view_mode': 'form',
            'target': 'current',
        }
