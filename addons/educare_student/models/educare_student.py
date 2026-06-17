import re
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models
from odoo.exceptions import UserError, ValidationError


class EducareStudent(models.Model):
    _name = "educare.student"
    _description = "Student Profile"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _rec_name = "name"
    _order = "student_code"

    def action_create_supervisor_profile(self):
        self.ensure_one()
        if not self.env.user.has_group("educare_security.group_admin"):
            raise UserError("Only Admin can create a new Supervisor from Student form.")

        view = self.env.ref("educare_security.educare_user_profile_form_view")
        return {
            "type": "ir.actions.act_window",
            "name": "Create Supervisor",
            "res_model": "educare.user.profile",
            "view_mode": "form",
            "view_id": view.id,
            "target": "new",
            "context": {
                "default_role": "supervisor",
                "default_center_id": self.center_id.id,
                "force_supervisor_role": True,
                "lock_role": True,
                "from_student_id": self.id,
            },
        }

    # ── Tab 1: General Information ─────────────────────────────────────────────────────────────
    # ── Identifier ─────────────────────────────────────────────────────────────
    name = fields.Char(
        string="Name",
        size=128,
        required=True,
        tracking=True,
    )
    nickname = fields.Char(
        string="Biệt danh",
        size=64,
        help="Biệt danh học sinh (chỉ giáo viên thấy, không hiển thị cho phụ huynh)",
    )
    student_code = fields.Char(
        string="Student Code",
        size=32,
        required=True,
        default="/",
        index=True,
        copy=False,
        readonly=True,
    )

    # ── Personal Information ────────────────────────────────────────────────────
    date_of_birth = fields.Date(
        string="Date of Birth",
        required=True,
    )
    age = fields.Integer(
        string="Age",
        compute="_compute_age",
    )
    age_months = fields.Integer(
        string="Age (months)",
        compute="_compute_age",
    )
    gender = fields.Selection(
        [
            ("male", "Nam"),
            ("female", "Nữ"),
            ("other", "Khác"),
        ],
        string="Gender",
        required=True,
    )

    avatar = fields.Binary(
        string="Profile Image",
        attachment=True,
    )

    # ── Academic Information ────────────────────────────────────────────────────
    school_name = fields.Char(string="School", size=128)
    class_name = fields.Char(string="Class", size=32)
    enrollment_date = fields.Date(
        string="Enrollment Date",
        required=True,
        index=True,
    )
    graduation_date = fields.Date(string="Graduation Date")
    status = fields.Selection(
        [
            ("active", "Đang học"),
            ("inactive", "Tạm ngừng"),
            ("graduated", "Đã tốt nghiệp"),
            ("transferred", "Đã chuyển trường"),
        ],
        string="Status",
        default="active",
        required=True,
        tracking=True,
        index=True,
    )

    # ── Assignment ────────────────────────────────────────────────────────────
    center_id = fields.Many2one(
        "educare.center",
        string="Center",
        required=True,
        ondelete="restrict",
        index=True,
        tracking=True,
    )
    assigned_teacher_id = fields.Many2one(
        "res.users",
        string="Assigned Teacher",
        required=True,
        ondelete="restrict",
        index=True,
        tracking=True,
        domain="[('educare_role', 'in', ['teacher', 'admin', 'supervisor']),"
        " '|', ('educare_profile_ids.center_id', '=', center_id),"
        " ('educare_profile_ids.center_id', '=', False)]",
    )
    co_teacher_ids = fields.Many2many(
        "res.users",
        relation="student_co_teacher_rel",
        string="Co-Teachers",
        domain="[('educare_role', 'in', ['teacher', 'supervisor']),"
        " '|', ('educare_profile_ids.center_id', '=', center_id),"
        " ('educare_profile_ids.center_id', '=', False),"
        " ('id', '!=', assigned_teacher_id)]",
    )
    supervisor_id = fields.Many2one(
        "res.users",
        string="Supervisor",
        ondelete="set null",
        domain="[('educare_role', 'in', ['supervisor']),"
        " '|', ('educare_profile_ids.center_id', '=', center_id),"
        " ('educare_profile_ids.center_id', '=', False)]",
    )

    # ── Tab 2: Parents & Guardians ───────────────────────────────────────────────────────
    parent_user_id = fields.Many2one(
        "res.users",
        string="Parent Account",
        ondelete="set null",
        tracking=True,
        domain="[('educare_role', '=', 'parent')]",
    )
    parent_name = fields.Char(
        string="Primary Parent/Guardian Name",
        size=128,
        compute="_compute_parent_info",
        inverse="_inverse_parent_name",
        store=True,
    )
    parent_relation = fields.Selection(
        [("father", "Cha"), ("mother", "Mẹ"), ("guardian", "Người giám hộ")],
        string="Relation",
    )
    parent_phone = fields.Char(
        string="Primary Parent/Guardian Phone",
        size=20,
        required=True,
        compute="_compute_parent_info",
        inverse="_inverse_parent_phone",
        store=True,
    )
    parent_email = fields.Char(
        string="Primary Parent/Guardian Email",
        size=128,
        compute="_compute_parent_info",
        inverse="_inverse_parent_email",
        store=True,
    )
    secondary_parent_name = fields.Char(
        string="Secondary Parent/Guardian Name", size=128
    )
    secondary_parent_relation = fields.Selection(
        [("father", "Cha"), ("mother", "Mẹ"), ("guardian", "Người giám hộ")],
        string="Secondary Relation",
    )
    secondary_parent_phone = fields.Char(
        string="Secondary Parent/Guardian Phone", size=20
    )
    emergency_contact_name = fields.Char(string="Emergency Contact Name", size=128)
    emergency_contact_phone = fields.Char(
        string="Emergency Contact Phone", size=20, required=True
    )
    emergency_contact_relation = fields.Char(
        string="Emergency Contact Relation", size=64
    )
    home_address = fields.Text(string="Home Address")
    preferred_contact_method = fields.Selection(
        [
            ("phone", "Điện thoại"),
            ("email", "Email"),
            ("app", "Ứng dụng"),
            ("zalo", "Zalo"),
        ],
        string="Preferred Contact Method",
    )
    receive_daily_report = fields.Boolean(string="Receive Daily Report", default=True)

    # ──  Tab 3: Diagnosis & Medical Fields ───────────────────────────────────────────────────────
    primary_diagnosis = fields.Selection(
        [
            ("autism", "Rối loạn phổ tự kỷ (ASD)"),
            ("adhd", "Tăng động giảm chú ý (ADHD)"),
            ("developmental_delay", "Chậm phát triển"),
            ("speech_delay", "Chậm nói"),
            ("intellectual_disability", "Khuyết tật trí tuệ"),
            ("cerebral_palsy", "Bại não"),
            ("down_syndrome", "Hội chứng Down"),
            ("other", "Khác"),
        ],
        required=True,
        tracking=True,
        index=True,
        string="Primary Diagnosis",
    )
    diagnosis_detail = fields.Text(string="Diagnosis Details")
    diagnosis_date = fields.Date(string="Diagnosis Date")
    diagnosed_by = fields.Char(
        string="Diagnosed By",
        size=128,
        help="Name of the diagnosing specialist or organization.",
    )
    secondary_diagnosis_ids = fields.Many2many(
        "educare.diagnosis",
        string="Secondary Diagnoses",
        relation="student_diagnosis_rel",
    )
    current_medications = fields.Text(string="Current Medications")
    allergies = fields.Text(string="Allergies")
    medical_alert = fields.Boolean(string="Medical Alert", default=False, tracking=True)
    medical_alert_detail = fields.Text(
        string="Medical Alert Details",
        help="If Medical Alert is checked, provide details here.",
        tracking=True,
    )
    special_diet = fields.Text(string="Special Diet")
    medical_notes = fields.Text(string="Medical Notes")
    immunization_notes = fields.Text(string="Immunization Notes")

    # ── Tab 4: Learning Abilities ─────────────────────────────────────────────────
    learning_style = fields.Selection(
        [
            ("visual", "Trực quan"),
            ("auditory", "Nghe"),
            ("kinesthetic", "Vận động / Thực hành"),
            ("mixed", "Kết hợp"),
        ],
        string="Kênh tiếp nhận ưu thế",
    )

    communication_level = fields.Selection(
        [
            ("non_verbal", "Chưa biết nói"),
            ("single_word", "Từ đơn"),
            ("phrase", "Cụm từ"),
            ("sentence", "Câu"),
            ("fluent", "Lưu loát"),
        ],
        string="Communication Level",
    )

    attention_span = fields.Integer(
        string="Attention Span (minutes)",
        default=0,
    )

    cognitive_level = fields.Selection(
        [
            ("severe", "Nghiêm trọng"),
            ("moderate", "Trung bình"),
            ("mild", "Nhẹ"),
            ("age_appropriate", "Phù hợp độ tuổi"),
        ],
        string="Cognitive Level",
    )

    motor_skill_gross = fields.Selection(
        [
            ("severe_delay", "Chậm nghiêm trọng"),
            ("moderate_delay", "Chậm trung bình"),
            ("mild_delay", "Chậm nhẹ"),
            ("age_appropriate", "Phù hợp độ tuổi"),
        ],
        string="Gross Motor Skills",
    )

    motor_skill_fine = fields.Selection(
        [
            ("severe_delay", "Chậm nghiêm trọng"),
            ("moderate_delay", "Chậm trung bình"),
            ("mild_delay", "Chậm nhẹ"),
            ("age_appropriate", "Phù hợp độ tuổi"),
        ],
        string="Fine Motor Skills",
    )

    self_care_level = fields.Selection(
        [
            ("dependent", "Phụ thuộc"),
            ("partial", "Độc lập một phần"),
            ("independent", "Độc lập"),
        ],
        string="Self-Care Level",
    )

    academic_notes = fields.Text(string="Learning Ability Notes")

    domain_ids = fields.Many2many(
        "educare.domain",
        relation="student_domain_rel",
        string="Intervention Domains",
    )

    # ── Tab 5: Behavior & Emotions ────────────────────────────────────────────────
    challenging_behaviors = fields.Text(string="Challenging Behaviors")
    behavior_triggers = fields.Text(string="Behavior Triggers")
    calming_strategies = fields.Text(string="Calming Strategies")
    sensory_sensitivities = fields.Text(string="Sensory Sensitivities")
    sensory_preferences = fields.Text(string="Sensory Preferences")
    reinforcement_preferences = fields.Text(string="Preferred Reinforcements")

    social_interaction_level = fields.Selection(
        [
            ("avoidant", "Né tránh"),
            ("passive", "Thụ động"),
            ("responsive", "Phản hồi"),
            ("initiating", "Chủ động"),
        ],
        string="Social Interaction Level",
    )

    emotional_regulation = fields.Selection(
        [
            ("poor", "Kém"),
            ("developing", "Đang phát triển"),
            ("adequate", "Đạt yêu cầu"),
            ("good", "Tốt"),
        ],
        string="Emotional Regulation",
    )

    behavior_notes = fields.Text(string="Behavior Notes")

    # ── Tab 6: Assessment ─────────────────────────────────────────────────────
    assessment_cycle = fields.Selection(
        [
            ("monthly", "Hàng tháng"),
            ("quarterly", "Hàng quý"),
            ("biannual", "Nửa năm"),
            ("annual", "Hàng năm"),
        ],
        string="Assessment Cycle",
        default="quarterly",
    )

    assessment_ids = fields.One2many(
        "educare.assessment",
        "student_id",
        string="Assessment Records",
    )

    # ── Computed summaries from assessment_ids ────────────────────────────────
    first_assessment_date = fields.Date(
        string="First Assessment Date",
        compute="_compute_assessment_stats",
        store=True,
    )
    last_assessment_date = fields.Date(
        string="Last Assessment Date",
        compute="_compute_assessment_stats",
        store=True,
    )
    next_assessment_date = fields.Date(
        string="Next Assessment Date",
        compute="_compute_assessment_stats",
        store=True,
    )
    latest_vbmapp_score = fields.Float(
        string="VB-MAPP Score (Latest)",
        compute="_compute_assessment_stats",
        store=True,
        digits=(5, 2),
    )
    latest_ablls_score = fields.Float(
        string="ABLLS-R Score (Latest)",
        compute="_compute_assessment_stats",
        store=True,
        digits=(5, 2),
    )
    latest_overall_progress = fields.Selection(
        [
            ("regression", "Suy thoái"),
            ("plateau", "Dậm chân"),
            ("slow", "Tiến bộ chậm"),
            ("steady", "Tiến bộ đều đặn"),
            ("rapid", "Tiến bộ nhanh"),
        ],
        string="Overall Progress (Latest)",
        compute="_compute_assessment_stats",
        store=True,
    )

    latest_classification = fields.Selection(
        [
            ("level_1", "Mức 1 — Nhẹ"),
            ("level_2", "Mức 2 — Trung bình"),
            ("level_3", "Mức 3 — Nghiêm trọng"),
        ],
        string="Classification (Latest)",
        compute="_compute_assessment_stats",
        store=True,
    )

    # ── Tab 7: History & Notes ────────────────────────────────────────────────
    transfer_ids = fields.One2many(
        "educare.transfer",
        "student_id",
        string="Transfer History",
    )

    referral_source = fields.Char(string="Referral Source", size=128)
    insurance_number = fields.Char(string="Insurance Number", size=32)
    internal_notes = fields.Text(string="Internal Notes (Staff Only)")
    parent_notes = fields.Text(string="Notes from Parent")
    active = fields.Boolean(string="Active", default=True)

    # ── One2many Placeholders ─────────────────────────────────────────────────────
    # Uncomment when corresponding modules are ready:
    # iep_goal_ids = fields.One2many(
    #     'educare.iep.goal', 'student_id', string='IEP Goals'
    # )
    # session_log_ids = fields.One2many(
    #     'educare.session.log', 'student_id', string='Session Logs'
    # )
    # lesson_plan_ids = fields.One2many(
    #     'educare.ai.lesson.plan', 'student_id', string='Lesson Plans'
    # )
    # daily_report_ids = fields.One2many(
    #     'educare.daily.report', 'student_id', string='Daily Reports'
    # )

    # ── SQL Constraints ───────────────────────────────────────────────────────
    _sql_constraints = [
        ("student_code_unique", "UNIQUE(student_code)", "Student code must be unique."),
        (
            "attention_span_positive",
            "CHECK(attention_span >= 0)",
            "Attention span must be greater than or equal to 0.",
        ),
    ]

    # ── Computed ──────────────────────────────────────────────────────────────
    @api.depends("date_of_birth")
    def _compute_age(self):
        today = fields.Date.today()
        for student in self:
            if student.date_of_birth:
                delta = relativedelta(today, student.date_of_birth)
                student.age = delta.years
                student.age_months = delta.years * 12 + delta.months
            else:
                student.age = 0
                student.age_months = 0

    # ── Computed: parent info ─────────────────────────────────────────────────
    @api.depends("parent_user_id", "parent_user_id.name", "parent_user_id.email")
    def _compute_parent_info(self):
        """
        When parent_user_id is set: pull name/phone/email from profile (or res.users fallback).
        When not set: keep stored DB values (via store=True + inverse).
        """
        for student in self:
            if not student.parent_user_id:
                continue
            profile = self.env["educare.user.profile"].search(
                [("user_id", "=", student.parent_user_id.id)], limit=1
            )
            if profile:
                student.parent_name = profile.user_id.name
                student.parent_email = profile.email
                if profile.phone:
                    student.parent_phone = profile.phone
                if profile.parent_relation:
                    student.parent_relation = profile.parent_relation
            else:
                student.parent_name = student.parent_user_id.name
                student.parent_email = student.parent_user_id.email

    # Inverse methods: allow direct edits on the form when needed
    def _inverse_parent_name(self):
        pass  # store=True handles persistence

    def _inverse_parent_phone(self):
        pass

    def _inverse_parent_email(self):
        pass

    # ── ORM Overrides ─────────────────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("student_code") or vals["student_code"] == "/":
                vals["student_code"] = (
                    self.env["ir.sequence"].next_by_code("educare.student") or "/"
                )
        return super().create(vals_list)

    @api.constrains("assigned_teacher_id", "co_teacher_ids")
    def _check_co_teacher_not_main(self):
        for student in self:
            if student.assigned_teacher_id in student.co_teacher_ids:
                raise ValidationError(
                    'Main teacher "%s" cannot also be assigned as co-teacher.'
                    % student.assigned_teacher_id.name
                )

    @api.constrains("date_of_birth", "enrollment_date", "graduation_date")
    def _check_dates(self):
        for student in self:
            if student.date_of_birth and student.date_of_birth > fields.Date.today():
                raise ValidationError("Birth date cannot be in the future!")
            if student.enrollment_date and student.date_of_birth:
                if student.enrollment_date < student.date_of_birth:
                    raise ValidationError(
                        "Enrollment date cannot be before birth date!"
                    )
            if student.graduation_date and student.enrollment_date:
                if student.graduation_date <= student.enrollment_date:
                    raise ValidationError(
                        "Graduation date must be after enrollment date!"
                    )

    @api.constrains("medical_alert", "medical_alert_detail")
    def _check_medical_alert(self):
        for student in self:
            if student.medical_alert and not student.medical_alert_detail:
                raise ValidationError("Must enter medical alert details!")

    @api.constrains("parent_phone", "emergency_contact_phone")
    def _check_phone_format(self):
        phone_pattern = re.compile(r"^0[3-9][0-9]{8}$")
        for student in self:
            for field_name in ("parent_phone", "emergency_contact_phone"):
                phone = getattr(student, field_name, "")
                if phone and not phone_pattern.match(phone):
                    raise ValidationError(
                        f'Phone number "{phone}" does not match the required format for Vietnam (0[3-9]xxxxxxxx)!'
                    )

    # ── Onchange ──────────────────────────────────────────────────────────────────
    @api.onchange("assigned_teacher_id")
    def _onchange_assigned_teacher(self):
        """Auto-fill center_id from the teacher's profile when not yet set."""
        if self.assigned_teacher_id:
            profile = self.env["educare.user.profile"].search(
                [("user_id", "=", self.assigned_teacher_id.id)], limit=1
            )
            if profile and profile.center_id:
                self.center_id = profile.center_id

    @api.onchange("center_id")
    def _onchange_center_id(self):
        """Clear teacher/supervisor when center changes to avoid mismatch."""
        if self.center_id:
            # Clear if current teacher doesn't belong to the new center
            if self.assigned_teacher_id:
                profile = self.env["educare.user.profile"].search(
                    [("user_id", "=", self.assigned_teacher_id.id)], limit=1
                )
                if (
                    profile
                    and profile.center_id
                    and profile.center_id != self.center_id
                ):
                    self.assigned_teacher_id = False
            if self.supervisor_id:
                profile = self.env["educare.user.profile"].search(
                    [("user_id", "=", self.supervisor_id.id)], limit=1
                )
                if (
                    profile
                    and profile.center_id
                    and profile.center_id != self.center_id
                ):
                    self.supervisor_id = False

    @api.onchange("status")
    def _onchange_status(self):
        """Auto-fill graduation_date when status changes to graduated."""
        if self.status == "graduated" and not self.graduation_date:
            self.graduation_date = fields.Date.today()

    # ── Display Name ──────────────────────────────────────────────────────────────
    @api.depends("name", "student_code")
    def _compute_display_name(self):
        for student in self:
            if student.student_code:
                student.display_name = f"[{student.student_code}] {student.name}"
            else:
                student.display_name = student.name

    @api.depends(
        "assessment_ids.assessment_date",
        "assessment_ids.vbmapp_score",
        "assessment_ids.ablls_score",
        "assessment_ids.overall_progress",
        "assessment_ids.classification",
        "assessment_cycle",
    )
    def _compute_assessment_stats(self):
        """Compute summary fields from the assessment_ids One2many."""
        cycle_days = {"monthly": 30, "quarterly": 90, "biannual": 180, "annual": 365}
        for student in self:
            assessments = student.assessment_ids
            if assessments:
                dates = assessments.mapped("assessment_date")
                student.first_assessment_date = min(dates)
                latest = assessments.sorted("assessment_date", reverse=True)[0]
                student.last_assessment_date = latest.assessment_date
                days = cycle_days.get(student.assessment_cycle, 90)
                student.next_assessment_date = latest.assessment_date + timedelta(
                    days=days
                )
                student.latest_vbmapp_score = latest.vbmapp_score
                student.latest_ablls_score = latest.ablls_score
                student.latest_overall_progress = latest.overall_progress
                student.latest_classification = latest.classification
            else:
                student.first_assessment_date = False
                student.last_assessment_date = False
                student.next_assessment_date = False
                student.latest_vbmapp_score = 0.0
                student.latest_ablls_score = 0.0
                student.latest_overall_progress = False
                student.latest_classification = False

    @api.model
    def _seed_demo_avatars(self):
        """Assign unique cycling avatars to all demo students.
        Overwrites existing avatars so re-running after a file update takes effect.
        Called from demo_seed.xml (noupdate=0) so it runs on --update too.
        """
        import base64
        import logging
        import os

        _log = logging.getLogger(__name__)
        avatar_dir = os.path.join(
            os.path.dirname(__file__), "..", "static", "img", "avatar"
        )
        filenames = [f"student_{i:02d}.jpg" for i in range(1, 10)]  # student_01..09
        imgs = []
        for fn in filenames:
            try:
                with open(os.path.join(avatar_dir, fn), "rb") as fh:
                    imgs.append(base64.b64encode(fh.read()))
            except OSError:
                _log.warning("educare_student: avatar not found: %s/%s", avatar_dir, fn)

        # Fallback to legacy pngs if jpgs are missing
        if not imgs:
            for fn in ["student1.png", "student2.png", "student3.png", "student4.png", "student5.png"]:
                try:
                    with open(os.path.join(avatar_dir, fn), "rb") as fh:
                        imgs.append(base64.b64encode(fh.read()))
                except OSError:
                    pass

        if not imgs:
            _log.warning("educare_student: no student avatar images found — skipping")
            return

        students = self.sudo().search([], order="student_code")
        for i, student in enumerate(students):
            student.sudo().write({"avatar": imgs[i % len(imgs)]})

        _log.info(
            "educare_student._seed_demo_avatars: seeded %d student(s)", len(students)
        )
