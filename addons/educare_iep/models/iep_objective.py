from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from datetime import timedelta
import uuid
from collections import defaultdict


# Module-level selection constants
OBJECTIVE_STATUS = [
    ('not_started', 'Not Started'),
    ('in_progress', 'In Progress'),
    ('on_hold', 'Paused'),
    ('mastered', 'Mastered'),
    ('discontinued', 'Discontinued'),
]

TREND_VALUES = [
    ('improving', 'Improving'),
    ('stable', 'Stable'),
    ('declining', 'Declining'),
    ('stagnant', 'Stagnant'),
    ('insufficient_data', 'Insufficient Data'),
]


class EducareIepObjective(models.Model):
    _name = 'educare.iep.objective'
    _description = 'IEP Short-term Objective'
    _rec_name = 'name'
    _order = 'goal_id, sequence, id'
    _inherit = ['mail.thread']

    # =========================================================================
    # Tab 1: General Information
    # =========================================================================
    name = fields.Char(
        string='Objective Name',
        size=256,
        required=True,
    )
    objective_code = fields.Char(
        string='Objective Code',
        size=32,
        default='/',
        required=True,
        index=True,
        copy=False,
        readonly=True,
    )
    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Parent Goal',
        required=True,
        ondelete='cascade',
        index=True,
    )
    # Related stored field — auto-filled from goal_id.student_id.
    # store=True allows search/filter/record rules on this field.
    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        related='goal_id.student_id',
        store=True,
        index=True,
    )
    sequence = fields.Integer(
        string='Sequence',
        default=10,
    )
    description = fields.Text(
        string='Objective Description',
        required=True,
    )
    status = fields.Selection(
        selection=OBJECTIVE_STATUS,
        string='Status',
        required=True,
        default='not_started',
        tracking=True,
        index=True,
    )
    start_date = fields.Date(string='Start Date')
    target_date = fields.Date(string='Target Date')
    mastery_date = fields.Date(string='Mastery Date', tracking=True)
    is_overdue = fields.Boolean(
        string='Overdue',
        compute='_compute_is_overdue',
        store=True,
        tracking=True,
        index=True,
    )
    can_delete = fields.Boolean(
        string='Can Delete',
        compute='_compute_can_delete',
        store=False,
    )

    # =========================================================================
    # Tab 2: Success Criteria
    # =========================================================================
    baseline_accuracy_pct = fields.Float(
        string='Baseline Accuracy (%)',
        digits=(5, 2),
        default=0.0,
        required=True,
    )
    target_accuracy_pct = fields.Float(
        string='Target Accuracy (%)',
        digits=(5, 2),
        default=80.0,
        required=True,
    )
    target_trials = fields.Integer(
        string='Trials per Session',
        default=10,
    )
    consecutive_sessions_required = fields.Integer(
        string='Consecutive Sessions Required',
        default=3,
        required=True,
        help='Số buổi liên tiếp đạt target accuracy để tính là mastered. '
             'Mặc định 3 buổi theo chuẩn ABA.',
    )
    consecutive_sessions_achieved = fields.Integer(
        string='Consecutive Sessions Achieved',
        compute='_compute_consecutive',
        store=True,
    )
    # NOTE: field tên là prompt_level_id (Many2one) nhưng _compute_mastery
    # trong session_result.py đọc objective_id.max_prompt_level (Char/Selection).
    # Giữ cả hai để tương thích: prompt_level_id cho UI, max_prompt_level
    # là related Char để session_result đọc code dạng string.
    prompt_level_id = fields.Many2one(
        'educare.iep.prompt.level',
        string='Max Prompt Level',
        ondelete='set null',
    )
    max_prompt_level = fields.Char(
        string='Max Prompt Level Code',
        related='prompt_level_id.code',
        store=True,
        help='Code dạng string để session_result._compute_mastery so sánh '
             'với PROMPT_ORDER. VD: "gestural_prompt".',
    )
    measurement_method = fields.Text(
        string='Data Collection Method',
        default='Quan sát trực tiếp trong buổi học.',
        required=True,
    )
    probe_method_id = fields.Many2one(
        'educare.iep.probe.method',
        string='Probe Method',
        ondelete='set null',
    )
    weight = fields.Float(
        string='Weight',
        digits=(5, 2),
        default=1.0,
        help='Relative importance for goal weighted average. '
             'Higher = more impact on overall goal progress.',
    )

    # =========================================================================
    # Tab 3: Actual Progress
    # =========================================================================
    current_accuracy_pct = fields.Float(
        string='Current Accuracy (%)',
        compute='_compute_accuracy',
        store=True,
        tracking=True,
        digits=(5, 2),
    )
    progress_pct = fields.Float(
        string='Progress (%)',
        compute='_compute_progress',
        store=True,
        digits=(5, 2),
    )
    trend = fields.Selection(
        selection=TREND_VALUES,
        string='Progress Trend',
        compute='_compute_trend',
        store=True,
    )
    last_session_date = fields.Date(
        string='Last Session Date',
        compute='_compute_last_session',
        store=True,
    )
    last_session_accuracy = fields.Float(
        string='Last Session Accuracy',
        compute='_compute_last_session',
        store=True,
        digits=(5, 2),
    )
    total_sessions_worked = fields.Integer(
        string='Total Sessions',
        compute='_compute_session_count',
        store=True,
    )
    alert_triggered = fields.Boolean(
        string='Alert',
        compute='_compute_alert_triggered',
        store=True,
        tracking=True,
        index=True,
    )
    alert_message = fields.Char(
        string='Alert Message',
        size=256,
        compute='_compute_alert_message',
        # store=False: display-only, không cần persist
    )
    discontinued_reason = fields.Text(string='Discontinued Reason', tracking=True)
    notes = fields.Text(string='Notes / Observations')

    # =========================================================================
    # SQL constraints
    # =========================================================================
    _sql_constraints = [
        ('objective_code_unique', 'UNIQUE(objective_code)',
         'Objective code must be unique.'),
        ('target_accuracy_check',
         'CHECK(target_accuracy_pct >= 0 AND target_accuracy_pct <= 100)',
         'Target accuracy must be between 0 and 100.'),
        ('baseline_accuracy_check',
         'CHECK(baseline_accuracy_pct >= 0 AND baseline_accuracy_pct <= 100)',
         'Baseline accuracy must be between 0 and 100.'),
        ('baseline_lt_target_check',
         'CHECK(baseline_accuracy_pct < target_accuracy_pct)',
         'Baseline accuracy must be less than target accuracy.'),
        ('consecutive_sessions_check',
         'CHECK(consecutive_sessions_required >= 1)',
         'Consecutive sessions required must be at least 1.'),
        ('weight_positive',
         'CHECK(weight > 0)',
         'Weight must be greater than 0.'),
    ]

    # =========================================================================
    # Python constraints
    # =========================================================================
    @api.constrains('start_date', 'target_date', 'goal_id')
    def _check_objective_dates(self):
        for obj in self:
            if obj.goal_id and obj.start_date and obj.goal_id.start_date:
                if obj.start_date < obj.goal_id.start_date:
                    raise ValidationError(
                        _('Objective start date cannot be before goal start date!')
                    )
            if obj.goal_id and obj.target_date and obj.goal_id.target_date:
                if obj.target_date > obj.goal_id.target_date:
                    raise ValidationError(
                        _('Objective target date cannot be after goal target date!')
                    )
            if obj.start_date and obj.target_date:
                if obj.target_date <= obj.start_date:
                    raise ValidationError(
                        _('Target date must be after start date!')
                    )

    @api.constrains('status', 'discontinued_reason')
    def _check_discontinued_reason(self):
        for obj in self:
            if obj.status == 'discontinued' and not obj.discontinued_reason:
                raise ValidationError(
                    _('Please provide a reason before discontinuing this objective.')
                )

    # =========================================================================
    # Computed fields — Progress tracking
    # =========================================================================

    def _session_tables_available(self):
        """Guard cross-module SQL calls when session module is unavailable."""
        self.env.cr.execute(
            """
            SELECT
                to_regclass('public.educare_session_result'),
                to_regclass('public.educare_session_log')
            """
        )
        table_result, table_log = self.env.cr.fetchone() or (None, None)
        return bool(table_result and table_log)

    @api.depends('status')
    def _compute_accuracy(self):
        """Moving average của 3 session completed/reviewed gần nhất.

        Dùng raw SQL để sort đúng theo session_date thay vì session_id,
        tránh sai khi session được nhập retroactively.

        Chỉ tính session có status completed hoặc reviewed — bỏ qua draft
        vì dữ liệu chưa được xác nhận.
        """
        persisted = self.filtered(lambda o: o.id)
        default_map = {obj.id: 0.0 for obj in persisted}

        if persisted and self._session_tables_available():
            self.env.cr.execute(
                """
                WITH ranked AS (
                    SELECT
                        sr.objective_id,
                        sr.accuracy_pct,
                        ROW_NUMBER() OVER (
                            PARTITION BY sr.objective_id
                            ORDER BY sl.session_date DESC, sl.id DESC
                        ) AS rn
                    FROM educare_session_result sr
                    JOIN educare_session_log sl ON sr.session_id = sl.id
                    WHERE sr.objective_id IN %s
                      AND sl.status IN ('completed', 'reviewed')
                      AND sr.total_trials > 0
                )
                SELECT objective_id, AVG(accuracy_pct)
                FROM ranked
                WHERE rn <= 3
                GROUP BY objective_id
                """,
                (tuple(persisted.ids),),
            )
            for objective_id, avg_accuracy in self.env.cr.fetchall():
                default_map[objective_id] = avg_accuracy or 0.0

        for obj in self:
            obj.current_accuracy_pct = default_map.get(obj.id, 0.0)

    @api.depends('current_accuracy_pct', 'target_accuracy_pct',
                 'baseline_accuracy_pct')
    def _compute_progress(self):
        """Tiến độ = (Current − Baseline) / (Target − Baseline) × 100.

        Công thức chuẩn IEP/ABA: đo mức cải thiện thực tế từ baseline.
        VD: baseline=20, current=50, target=80
            → (50−20)/(80−20) = 50%  ← phản ánh đúng 50% chặng đường
        So với naive 50/80 = 62.5%   ← misleading vì không tính baseline.

        Clamp về [0, 100]: không cho âm (regression) và không vượt 100%.
        """
        for obj in self:
            denominator = obj.target_accuracy_pct - obj.baseline_accuracy_pct
            if denominator > 0:
                raw = (
                    (obj.current_accuracy_pct - obj.baseline_accuracy_pct)
                    / denominator
                ) * 100
                obj.progress_pct = min(100.0, max(0.0, raw))
            else:
                obj.progress_pct = 0.0

    @api.depends('status', 'target_accuracy_pct', 'current_accuracy_pct')
    def _compute_trend(self):
        """Xu hướng tiến triển dùng linear regression slope.

        Cần tối thiểu 4 session completed/reviewed để có ý nghĩa thống kê.

        Ngưỡng slope (% / session):
            slope >  2.0  → improving
            slope < -2.0  → declining
            [-2, +2]      → stable hoặc stagnant

        Stagnant = stable nhưng accuracy vẫn < 70% target
        (trẻ không giảm nhưng cũng không tiến — cần thay đổi chiến lược).
        """
        persisted = self.filtered(lambda o: o.id)
        grouped_accuracies = defaultdict(list)

        if persisted and self._session_tables_available():
            self.env.cr.execute(
                """
                SELECT sr.objective_id, sr.accuracy_pct
                FROM educare_session_result sr
                JOIN educare_session_log sl ON sr.session_id = sl.id
                WHERE sr.objective_id IN %s
                  AND sl.status IN ('completed', 'reviewed')
                  AND sr.total_trials > 0
                ORDER BY sr.objective_id ASC, sl.session_date ASC, sl.id ASC
                """,
                (tuple(persisted.ids),),
            )
            for objective_id, accuracy in self.env.cr.fetchall():
                grouped_accuracies[objective_id].append(accuracy)

        for obj in self:
            accuracies = grouped_accuracies.get(obj.id, [])
            if len(accuracies) < 4:
                obj.trend = 'insufficient_data'
                continue

            # Linear regression slope: y = accuracy, x = session index
            n = len(accuracies)
            x_vals = list(range(n))
            x_mean = sum(x_vals) / n
            y_mean = sum(accuracies) / n
            numerator = sum(
                (x - x_mean) * (y - y_mean)
                for x, y in zip(x_vals, accuracies)
            )
            denominator = sum((x - x_mean) ** 2 for x in x_vals)
            slope = numerator / denominator if denominator else 0.0

            if slope > 2.0:
                obj.trend = 'improving'
            elif slope < -2.0:
                obj.trend = 'declining'
            else:
                # Phân biệt stable vs stagnant
                if obj.current_accuracy_pct < obj.target_accuracy_pct * 0.7:
                    obj.trend = 'stagnant'
                else:
                    obj.trend = 'stable'

    @api.depends('status')
    def _compute_last_session(self):
        """Thông tin buổi học gần nhất đã completed/reviewed.

        Dùng raw SQL để sort theo session_date thay vì session_id,
        đảm bảo đúng khi có session nhập retroactively.
        """
        persisted = self.filtered(lambda o: o.id)
        last_session_map = {}

        if persisted and self._session_tables_available():
            self.env.cr.execute(
                """
                SELECT DISTINCT ON (sr.objective_id)
                    sr.objective_id,
                    sl.session_date,
                    sr.accuracy_pct
                FROM educare_session_result sr
                JOIN educare_session_log sl ON sr.session_id = sl.id
                WHERE sr.objective_id IN %s
                  AND sl.status IN ('completed', 'reviewed')
                  AND sr.total_trials > 0
                ORDER BY sr.objective_id, sl.session_date DESC, sl.id DESC
                """,
                (tuple(persisted.ids),),
            )
            for objective_id, session_date, accuracy in self.env.cr.fetchall():
                last_session_map[objective_id] = (session_date, accuracy)

        for obj in self:
            session_data = last_session_map.get(obj.id)
            if session_data:
                obj.last_session_date = session_data[0]
                obj.last_session_accuracy = session_data[1]
            else:
                obj.last_session_date = False
                obj.last_session_accuracy = 0.0

    @api.depends('status')
    def _compute_session_count(self):
        """Tổng số session completed/reviewed đã làm việc objective này.

        Chỉ đếm session đã hoàn thành — không tính draft vì dữ liệu
        chưa được xác nhận và sẽ gây misleading trên Dashboard.
        """
        persisted = self.filtered(lambda o: o.id)
        count_map = {obj.id: 0 for obj in persisted}

        if persisted and self._session_tables_available():
            self.env.cr.execute(
                """
                SELECT sr.objective_id, COUNT(*)
                FROM educare_session_result sr
                JOIN educare_session_log sl ON sr.session_id = sl.id
                WHERE sr.objective_id IN %s
                  AND sl.status IN ('completed', 'reviewed')
                  AND sr.total_trials > 0
                GROUP BY sr.objective_id
                """,
                (tuple(persisted.ids),),
            )
            for objective_id, session_count in self.env.cr.fetchall():
                count_map[objective_id] = session_count

        for obj in self:
            obj.total_sessions_worked = count_map.get(obj.id, 0)

    @api.depends('status')
    def _compute_consecutive(self):
        """Số buổi liên tiếp gần nhất đạt mastery_achieved = True.

        Đếm ngược từ session gần nhất, dừng ngay khi gặp buổi không đạt.
        VD: [True, True, False, True] → count = 2 (chỉ 2 buổi gần nhất).

        QUAN TRỌNG: Method này CHỈ tính số — không write() gì cả.
        Mastery check được tách sang _check_mastery() để tránh
        infinite loop (write trong compute → trigger recompute → write...).
        """
        persisted = self.filtered(lambda o: o.id)
        grouped_mastery = defaultdict(list)

        if persisted and self._session_tables_available():
            self.env.cr.execute(
                """
                SELECT sr.objective_id, sr.mastery_achieved
                FROM educare_session_result sr
                JOIN educare_session_log sl ON sr.session_id = sl.id
                WHERE sr.objective_id IN %s
                  AND sl.status IN ('completed', 'reviewed')
                  AND sr.total_trials > 0
                ORDER BY sr.objective_id ASC, sl.session_date DESC, sl.id DESC
                """,
                (tuple(persisted.ids),),
            )
            for objective_id, mastery_achieved in self.env.cr.fetchall():
                grouped_mastery[objective_id].append(bool(mastery_achieved))

        for obj in self:
            count = 0
            for mastery_achieved in grouped_mastery.get(obj.id, []):
                if mastery_achieved:
                    count += 1
                else:
                    break
            obj.consecutive_sessions_achieved = count

    # =========================================================================
    # Computed fields — Overdue & Can Delete
    # =========================================================================

    @api.depends('target_date', 'status')
    def _compute_is_overdue(self):
        today = fields.Date.today()
        for obj in self:
            obj.is_overdue = bool(
                obj.target_date
                and obj.target_date < today
                and obj.status not in ('mastered', 'discontinued')
            )

    @api.depends('goal_id.plan_id.status')
    def _compute_can_delete(self):
        for obj in self:
            obj.can_delete = bool(
                obj.goal_id
                and obj.goal_id.plan_id
                and obj.goal_id.plan_id.status == 'draft'
            )

    # =========================================================================
    # Computed fields — Alert system
    # =========================================================================

    @api.depends(
        'trend', 'last_session_date',
        'current_accuracy_pct', 'target_accuracy_pct', 'status',
    )
    def _compute_alert_triggered(self):
        """Stored Boolean — có alert hay không.

        Tách riêng alert_triggered (stored, indexable) và alert_message
        (non-stored, display-only) để:
        - Dashboard/list view filter nhanh qua alert_triggered = True
        - Không cần store text để tiết kiệm storage
        """
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != 'in_progress':
                obj.alert_triggered = False
                continue
            obj.alert_triggered = (
                obj.trend in ('declining', 'stagnant')
                or (
                    obj.last_session_date
                    and obj.last_session_date < cutoff_date
                )
                or (
                    obj.current_accuracy_pct > 0
                    and obj.current_accuracy_pct < obj.target_accuracy_pct * 0.5
                )
            )

    @api.depends(
        'trend', 'last_session_date',
        'current_accuracy_pct', 'target_accuracy_pct', 'status',
    )
    def _compute_alert_message(self):
        """Non-stored — human-readable message cho từng loại alert.

        Ưu tiên theo mức nghiêm trọng:
        1. declining  (tệ nhất — accuracy đang giảm)
        2. accuracy < 50% target (nguy hiểm)
        3. stagnant   (không tiến dù không giảm)
        4. no session 2 tuần (bị bỏ sót)
        """
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != 'in_progress':
                obj.alert_message = ''
                continue

            if obj.trend == 'declining':
                obj.alert_message = _(
                    'Declining trend — review teaching method'
                )
            elif (obj.current_accuracy_pct > 0
                  and obj.current_accuracy_pct < obj.target_accuracy_pct * 0.5):
                obj.alert_message = _(
                    'Accuracy below 50% of target — consider modifying approach'
                )
            elif obj.trend == 'stagnant':
                obj.alert_message = _(
                    'No improvement — consider modifying approach'
                )
            elif (obj.last_session_date
                  and obj.last_session_date < cutoff_date):
                obj.alert_message = _(
                    'No session in the last 2 weeks'
                )
            else:
                obj.alert_message = ''

    # =========================================================================
    # Business methods
    # =========================================================================

    def _check_mastery(self):
        """Kiểm tra và auto-set mastered nếu đủ điều kiện.

        Gọi từ session_log._update_objective_progress() sau khi session
        được complete — KHÔNG gọi từ computed field để tránh infinite loop.

        Điều kiện mastered:
        1. Status đang in_progress (không xử lý các status khác)
        2. consecutive_sessions_achieved >= consecutive_sessions_required
        3. current_accuracy_pct >= target_accuracy_pct
        """
        for obj in self:
            if obj.status != 'in_progress':
                continue
            if (obj.consecutive_sessions_achieved >= obj.consecutive_sessions_required
                    and obj.current_accuracy_pct >= obj.target_accuracy_pct):
                obj.write({
                    'status': 'mastered',
                    'mastery_date': fields.Date.today(),
                })

    def _is_mastery_criteria_met(self):
        """Check nhanh mastery criteria — dùng trong _auto_sync_status_from_rules."""
        self.ensure_one()
        return (
            self.current_accuracy_pct >= self.target_accuracy_pct
            and self.consecutive_sessions_achieved >= self.consecutive_sessions_required
        )

    def _auto_sync_status_from_rules(self):
        """Auto transition objective status dựa trên timeline và mastery.

        Được gọi từ create/write. Context flag 'skip_auto_objective_status_sync'
        tránh infinite recursion khi write trigger write.
        """
        if self.env.context.get('skip_auto_objective_status_sync'):
            return

        today = fields.Date.today()
        for objective in self:
            # Không can thiệp vào các trạng thái do expert set thủ công
            if objective.status in ('on_hold', 'discontinued', 'mastered'):
                continue
            if objective.goal_id.status != 'active':
                continue

            vals = {}
            # not_started → in_progress nếu đã đến start_date
            if (objective.status == 'not_started'
                    and objective.start_date
                    and objective.start_date <= today):
                vals['status'] = 'in_progress'

            # in_progress → mastered nếu đủ điều kiện
            target_status = vals.get('status', objective.status)
            if (target_status in ('not_started', 'in_progress')
                    and objective._is_mastery_criteria_met()):
                vals['status'] = 'mastered'
                vals['mastery_date'] = objective.mastery_date or today

            if vals:
                objective.with_context(
                    skip_auto_objective_status_sync=True
                ).write(vals)

    @api.model
    def cron_auto_sync_objective_status(self):
        """Daily cron: giữ objective status đồng bộ với date-driven rules."""
        objectives = self.search([
            ('status', 'in', ['not_started', 'in_progress']),
            ('goal_id.status', '=', 'active'),
        ])
        objectives._auto_sync_status_from_rules()

    # =========================================================================
    # Display name
    # =========================================================================

    def name_get(self):
        result = []
        for obj in self:
            if obj.objective_code and obj.objective_code != '/':
                result.append((obj.id, f"[{obj.objective_code}] {obj.name}"))
            else:
                result.append((obj.id, obj.name or ''))
        return result

    # =========================================================================
    # ORM overrides
    # =========================================================================

    def _next_objective_code(self):
        sequence_model = self.env['ir.sequence'].sudo()
        code = sequence_model.next_by_code('educare.iep.objective')
        if not code:
            seq = sequence_model.search(
                [('code', '=', 'educare.iep.objective')], limit=1
            )
            if seq:
                code = seq.next_by_id()
        if not code:
            year = fields.Date.today().year
            code = f"STO-{year}-{uuid.uuid4().hex[:8].upper()}"
        return code

    def _prepare_dates_from_goal(self, vals):
        """Fill objective dates từ parent goal khi user để trống."""
        goal_id = vals.get('goal_id')
        if not goal_id:
            return vals
        goal = self.env['educare.iep.goal'].browse(goal_id)
        if goal.exists():
            vals.setdefault('start_date', goal.start_date)
            vals.setdefault('target_date', goal.target_date)
        return vals

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            self._prepare_dates_from_goal(vals)
            if not vals.get('objective_code') or vals['objective_code'] == '/':
                vals['objective_code'] = self._next_objective_code()
        objectives = super().create(vals_list)
        objectives._auto_sync_status_from_rules()
        objectives.mapped('goal_id')._auto_update_status_from_workflow()
        return objectives

    def write(self, vals):
        vals = dict(vals)
        if 'objective_code' in vals and vals['objective_code'] == '/':
            vals['objective_code'] = self._next_objective_code()
        if 'objective_code' not in vals:
            need_patch = self.filtered(
                lambda rec: not rec.objective_code or rec.objective_code == '/'
            )
            if need_patch:
                for rec in need_patch:
                    rec.with_context(skip_goal_sync=True).write(
                        {'objective_code': self._next_objective_code()}
                    )
        result = super().write(vals)
        if not self.env.context.get('skip_auto_objective_status_sync'):
            self._auto_sync_status_from_rules()
        if ({'status', 'goal_id'}.intersection(vals)
                and not self.env.context.get('skip_goal_sync')):
            self.mapped('goal_id')._auto_update_status_from_workflow()
        return result

    def unlink(self):
        for obj in self:
            if (obj.goal_id
                    and obj.goal_id.plan_id
                    and obj.goal_id.plan_id.status != 'draft'):
                raise ValidationError(
                    _('Objectives can be deleted only when the parent plan is in Draft.')
                )
        goals = self.mapped('goal_id')
        result = super().unlink()
        goals._auto_update_status_from_workflow()
        return result

    # =========================================================================
    # Onchange handlers
    # =========================================================================

    @api.onchange('status')
    def _onchange_status(self):
        if self.status == 'mastered' and not self.mastery_date:
            self.mastery_date = fields.Date.today()

    @api.onchange('goal_id')
    def _onchange_goal_id_dates(self):
        if self.goal_id:
            if not self.start_date:
                self.start_date = self.goal_id.start_date
            if not self.target_date:
                self.target_date = self.goal_id.target_date

    # =========================================================================
    # Actions
    # =========================================================================

    def action_start(self):
        """Not Started → In Progress."""
        for obj in self:
            if obj.status != 'not_started':
                continue
            vals = {'status': 'in_progress'}
            if not obj.start_date:
                vals['start_date'] = fields.Date.today()
            obj.write(vals)

    def action_put_on_hold(self):
        """In Progress → Paused."""
        for obj in self:
            if obj.status == 'in_progress':
                obj.write({'status': 'on_hold'})

    def action_resume(self):
        """Paused → In Progress."""
        for obj in self:
            if obj.status == 'on_hold':
                obj.write({'status': 'in_progress'})

    def action_mark_mastered(self):
        """Manual mastery — không cần đủ consecutive sessions."""
        for obj in self:
            if obj.status not in ('in_progress', 'on_hold'):
                continue
            vals = {'status': 'mastered'}
            if not obj.mastery_date:
                vals['mastery_date'] = fields.Date.today()
            obj.write(vals)

    def action_open_discontinue_wizard(self):
        self.ensure_one()
        if self.status in ('mastered', 'discontinued'):
            raise ValidationError(
                _('Cannot discontinue an objective that is already '
                  'Mastered or Discontinued.')
            )
        action = self.env.ref(
            'educare_iep.action_educare_iep_objective_discontinue_wizard'
        ).read()[0]
        action['context'] = {
            'default_objective_id': self.id,
            'default_reason': False,
            'default_notes': '',
        }
        return action

    def action_delete_objective(self):
        self.ensure_one()
        goal = self.goal_id
        self.unlink()
        action = self.env.ref(
            'educare_iep.action_educare_iep_goal_form'
        ).read()[0]
        if goal:
            action['res_id'] = goal.id
        return action