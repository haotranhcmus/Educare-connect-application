from odoo import models, fields, api


class EducareUserProfile(models.Model):
    _name = 'educare.user.profile'
    _description = 'Educare User Profile'
    _inherit = ['mail.thread', 'mail.activity.mixin', 'educare.audit.mixin']
    _rec_name = 'display_name'

    # ── Nhóm 1: Liên kết User ────────────────────────────────────────────────
    user_id = fields.Many2one(
        'res.users',
        string='User',
        required=True,
        ondelete='cascade',
        index=True,
    )
    display_name = fields.Char(
        string='Display Name',
        compute='_compute_display_name',
        store=True,
    )
    email = fields.Char(
        string='Email',
        related='user_id.email',
        readonly=True,
    )
    phone = fields.Char(string='Phone', size=20)
    avatar = fields.Binary(
        string='Avatar',
        related='user_id.image_128',
    )

    # ── Nhóm 2: Vai trò & Tổ chức ────────────────────────────────────────────
    role = fields.Selection([
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
    ], string='Role', tracking=True)

    center_id = fields.Many2one(
        'educare.center',
        string='Center',
        ondelete='set null',
        tracking=True,
    )
    job_title = fields.Char(string='Job Title', size=128)
    department = fields.Char(string='Department', size=128)
    employee_code = fields.Char(string='Employee Code', size=20, index=True)

    # ── Nhóm 3: Trạng thái & Bảo mật ────────────────────────────────────────
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ], string='Status', default='active', tracking=True)

    date_joined = fields.Date(
        string='Date Joined',
        default=fields.Date.today,   # ← reference, không gọi hàm
    )
    last_login = fields.Datetime(string='Last Login', readonly=True)
    login_count = fields.Integer(string='Login Count', default=0, readonly=True)
    failed_login_count = fields.Integer(
        string='Failed Login Count', default=0, readonly=True
    )
    last_failed_login = fields.Datetime(
        string='Last Failed Login', readonly=True
    )
    account_locked = fields.Boolean(
        string='Account Locked', default=False, tracking=True
    )
    lock_reason = fields.Char(string='Lock Reason', size=256)
    two_factor_enabled = fields.Boolean(
        string='Two-Factor Auth', default=False
    )

    # ── Nhóm 4: Chuyên môn (Teacher/Supervisor) ──────────────────────────────
    specialization = fields.Text(string='Specialization')
    certification = fields.Char(
        string='Certifications (BCBA, RBT, etc.)', size=256
    )
    years_experience = fields.Integer(string='Years of Experience')
    bio = fields.Text(string='Biography')
    max_students = fields.Integer(
        string='Max Students Capacity', default=8
    )
    current_student_count = fields.Integer(
        string='Current Student Count',
        compute='_compute_student_count',
    )

    # ── Nhóm 5: Phụ huynh (Parent role) ──────────────────────────────────────
    parent_relation = fields.Selection([
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
        ('other', 'Other'),
    ], string='Relationship')

    student_ids = fields.Many2many(
        'res.partner',
        string='Students',
        compute='_compute_student_ids',
    )
    preferred_contact = fields.Selection([
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('zalo', 'Zalo'),
        ('sms', 'SMS'),
    ], string='Preferred Contact')
    receive_notifications = fields.Boolean(
        string='Receive Notifications', default=True
    )

    # ── SQL Constraints ───────────────────────────────────────────────────────
    _sql_constraints = [
        ('unique_user', 'UNIQUE(user_id)',
         'Each user can only have one profile!'),
        ('unique_employee_code', 'UNIQUE(employee_code)',
         'Employee code must be unique!'),
    ]

    # ── Computed Methods ──────────────────────────────────────────────────────
    @api.depends('user_id', 'user_id.name', 'role')
    def _compute_display_name(self):
        for rec in self:
            role_label = dict(
                rec._fields['role'].selection
            ).get(rec.role, '')
            if rec.user_id:
                rec.display_name = f"{rec.user_id.name} ({role_label})"
            else:
                rec.display_name = ''

    def _compute_student_count(self):
        # Placeholder — wire khi educare_student sẵn sàng
        for rec in self:
            rec.current_student_count = 0

    def _compute_student_ids(self):
        # Placeholder — will be wired when educare_student is ready
        for rec in self:
            rec.student_ids = self.env['res.partner']

    # ── Action Methods ────────────────────────────────────────────────────────
    def action_sync_security_group(self):
        """Đồng bộ Odoo security group theo role selection"""
        group_map = {
            'admin': self.env.ref('educare_security.group_admin'),
            'supervisor': self.env.ref('educare_security.group_supervisor'),
            'teacher': self.env.ref('educare_security.group_teacher'),
            'parent': self.env.ref('educare_security.group_parent'),
        }
        # Gộp tất cả groups thành 1 recordset để xóa cùng lúc
        all_groups = sum(
            group_map.values(),
            self.env['res.groups']
        )
        for rec in self:
            if rec.role and rec.user_id:
                rec.user_id.groups_id -= all_groups          # Xóa tất cả
                rec.user_id.groups_id += group_map[rec.role] # Thêm đúng group

    # ── ORM Overrides ─────────────────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records.filtered('role').action_sync_security_group()
        return records

    def write(self, vals):
        res = super().write(vals)
        if 'role' in vals:
            self.action_sync_security_group()
        return res
    

class ResUsers(models.Model):
    _inherit = 'res.users'

    educare_profile_ids = fields.One2many(
        'educare.user.profile',
        'user_id',
        string='Educare Profiles',
    )