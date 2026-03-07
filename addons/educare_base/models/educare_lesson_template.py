from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class EducareLessonTemplate(models.Model):
    _name = 'educare.lesson.template'
    _description = 'Educare Lesson Template'
    _inherit = ['mail.thread']
    _order = 'sequence,name'

    name = fields.Char(string="Template Name", required=True, translate=True, tracking=True)
    code = fields.Char(string="Template Code", required=True, index=True)
    active = fields.Boolean(string="Active", default=True)
    description = fields.Html(string="Description", translate=True)
    domain_id = fields.Many2one('educare.domain', string="Development Domain", required=True, ondelete='restrict', tracking=True)
    difficulty_level = fields.Selection([('beginner','Beginner'), ('intermediate','Intermediate'), ('advanced','Advanced')], string="Difficulty Level", tracking=True)
    target_age_min = fields.Integer(string="Target Age Min (months)")
    target_age_max = fields.Integer(string="Target Age Max (months)")
    session_duration_mins = fields.Integer(string="Session Duration (minutes)", default=45)
    source = fields.Selection([('original','Original'), ('twinkl','Twinkl'), ('vbmapp','VB-MAPP'), ('ablls_r','ABLLS-R'), ('autism_helper','Autism Helper'), ('attainment','Attainment Company'), ('other','Other')], string="Source", tracking=True)
    source_url = fields.Char(string="Source URL", help="Link to the original lesson plan or resource")
    source_reference = fields.Char(string="Source Reference", help="Additional reference information about the source")
    materials_needed = fields.Text(string="Materials Needed", translate=True)
    objectives_text = fields.Text(string="Template Objectives", translate=True)
    notes = fields.Text(string="Additional Notes", translate=True)
    activity_line_ids = fields.One2many('educare.lesson.template.activity', 'template_id', string="Activities")
    activity_count = fields.Integer(string="Number of Activities", compute="_compute_activity_count", store=True)
    color = fields.Integer(string="Color Index", default=0)
    sequence = fields.Integer(string="Sequence", default=10)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The template code must be unique.'),
        ('target_age_check', 'CHECK(target_age_min >= 0 AND target_age_max >= 0)', 'Target ages must be non-negative.'),
    ]

    @api.depends('activity_line_ids')
    def _compute_activity_count(self):
        for record in self:
            record.activity_count = len(record.activity_line_ids)
    
    @api.constrains('target_age_min', 'target_age_max')
    def _check_age_range(self):
        for rec in self:
            if rec.target_age_min and rec.target_age_max:
                if rec.target_age_max < rec.target_age_min:
                    raise ValidationError(
                        _("Target age max (%s months) must be greater than or equal to target age min (%s months).")
                        % (rec.target_age_max, rec.target_age_min)
                    )