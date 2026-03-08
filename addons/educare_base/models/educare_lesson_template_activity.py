from odoo import fields, models


class EducareLessonTemplateActivity(models.Model):
    _name = "educare.lesson.template.activity"
    _description = "Educare Lesson Template Activity"
    _order = "sequence,id"

    template_id = fields.Many2one(
        "educare.lesson.template",
        string="Lesson Template",
        required=True,
        ondelete="cascade",
    )
    sequence = fields.Integer(string="Sequence", default=10)
    name = fields.Char(string="Activity Name", required=True, translate=True)
    description = fields.Html(string="Activity Description", translate=True)
    activity_type = fields.Selection(
        [
            ("dtt", "DTT"),
            ("net", "NET"),
            ("group", "Group"),
            ("sensory", "Sensory"),
            ("communication", "Communication"),
            ("social", "Social"),
            ("motor", "Motor"),
            ("academic", "Academic"),
            ("play", "Play"),
            ("transition", "Transition"),
        ]
    )
    duration_mins = fields.Integer(string="Duration (minutes)", default=10)
    prompt_level_suggested = fields.Selection(
        [
            ("independent", "Independent"),
            ("verbal", "Verbal"),
            ("gestural", "Gestural"),
            ("partial_physical", "Partial Physical"),
            ("full_physical", "Full Physical"),
        ]
    )
    materials = fields.Text(string="Materials Needed", translate=True)
    reinforcement_type = fields.Char(string="Reinforcement Type", translate=True)
    data_collection_note = fields.Text(string="Data Collection Note", translate=True)
