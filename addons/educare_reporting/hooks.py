import logging
from datetime import timedelta

from odoo import fields

_logger = logging.getLogger(__name__)

# Prompt levels worst → best (weights 0/25/50/75/100); index = star count - 1.
LEVELS_ASC = ["no_response", "physical", "verbal", "gestural_visual", "independent"]


def post_init_hook(env):
    """Generate demo data (An + Khoa) after install.

    Runs only when demo data is enabled for this module and is idempotent —
    a re-run on an already-seeded DB is a no-op. All transactional demo data
    (students → plans → goals → objectives → sessions → results → reports)
    lives here so dates stay relative to "today" on every fresh reinstall and
    objectives are always sourced from the template library.
    """
    module = env["ir.module.module"].sudo().search(
        [("name", "=", "educare_reporting")], limit=1
    )
    if not module or not module.demo:
        _logger.info("educare_reporting: demo disabled — skip demo generation")
        return
    if env["educare.student"].sudo().search_count(
        [("student_code", "=", "IEP-DEMO-AN")]
    ):
        _logger.info("educare_reporting: demo already present — skip")
        return
    EducareDemoBuilder(env).run()
    _logger.info("educare_reporting: demo data generated (An + Khoa)")


class EducareDemoBuilder:
    def __init__(self, env):
        # install_module mirrors Odoo's XML data loader context — it bypasses the
        # plan "install-only" gates (active-gate, status-transition) the same way
        # the demo XML used to rely on.
        self.env = env(context=dict(env.context, install_module=True))
        self.today = fields.Date.today()
        self.teacher = env.ref("educare_security.user_educare_teacher_01")
        self.supervisor = env.ref("educare_security.user_educare_supervisor_hcm")
        self.parent = env.ref("educare_security.user_educare_parent_01")
        self.center = env.ref("educare_base.center_hcm")

    # ── Public ────────────────────────────────────────────────────
    def run(self):
        self._build_an()
        self._build_khoa()
        self.env["educare.student"]._seed_demo_avatars()

    # ── Generic helpers ───────────────────────────────────────────
    def _date(self, days):
        return self.today + timedelta(days=days)

    def _draft_plan(self, student, start_days, end_days):
        return self.env["educare.iep.plan"].create({
            "student_id": student.id,
            "supervisor_id": self.supervisor.id,
            "iep_period": "2026-H1",
            "start_date": self._date(start_days),
            "end_date": self._date(end_days),
            "review_frequency": "biweekly",
            "status": "draft",
        })

    def _activate_plan(self, plan):
        # Plan must already have at least one goal before going Active.
        plan.with_context(
            skip_status_transition_check=True, skip_auto_status_flow=True
        ).write({
            "supervisor_approved": True,
            "approved_date": plan.start_date + timedelta(days=1),
            "status": "active",
        })

    def _goal(self, plan, name, domain_xmlid, baseline, target):
        return self.env["educare.iep.goal"].create({
            "name": name,
            "plan_id": plan.id,
            "goal_domain_id": self.env.ref(domain_xmlid).id,
            "status": "draft",
            "baseline_accuracy_pct": baseline,
            "target_accuracy_pct": target,
            "goal_description": name,
        })

    def _activate_goal(self, goal):
        goal.with_context(skip_auto_goal_status_sync=True).write({"status": "active"})

    def _objective(self, goal, template_xmlid, sequence=10):
        """Create a student objective faithfully sourced from a library template."""
        tpl = self.env.ref(template_xmlid)
        return self.env["educare.iep.objective"].create({
            "goal_id": goal.id,
            "name": tpl.name,
            "description": tpl.description,
            "measurement_type": tpl.default_measurement_type or "accuracy",
            "baseline_accuracy_pct": tpl.default_baseline_accuracy_pct or 0.0,
            "target_accuracy_pct": tpl.default_target_accuracy_pct or 80.0,
            "target_prompt_level": tpl.default_target_prompt_level or False,
            "target_duration_seconds": tpl.default_target_duration_seconds or 0,
            "baseline_count": tpl.default_baseline_count or 0,
            "target_count": tpl.default_target_count or 0,
            "consecutive_sessions_required": tpl.default_consecutive_sessions or 3,
            "weight": tpl.difficulty_id.weight if tpl.difficulty_id else 1.0,
            "sequence": sequence,
            "status": "in_progress",
            "source_template_id": tpl.id,
            "smart_specific": tpl.smart_specific or False,
            "smart_measurable": tpl.smart_measurable or False,
            "smart_analysis": tpl.smart_analysis or False,
            "smart_timebound": tpl.smart_timebound or False,
            "materials_needed": tpl.materials_needed or False,
            "implementation_steps": tpl.implementation_steps or False,
            "age_min_months": tpl.age_min_months or False,
            "age_max_months": tpl.age_max_months or False,
            "difficulty_id": tpl.difficulty_id.id if tpl.difficulty_id else False,
            "domain_ids": [(6, 0, tpl.template_domain_ids.ids)],
            "relevant_diagnosis_ids": [(6, 0, tpl.relevant_diagnosis_ids.ids)],
            "suggested_prompt_level_id": (
                tpl.suggested_prompt_level.id if tpl.suggested_prompt_level else False
            ),
            "measurement_template_id": (
                tpl.measurement_template_id.id if tpl.measurement_template_id else False
            ),
        })

    def _levels_for_avg(self, avg, n=4):
        """Return n prompt levels whose average weight ≈ avg (multiples of 25)."""
        total_units = avg * n / 25.0
        base = int(total_units // n)
        rem = int(round(total_units - base * n))
        units = [base] * n
        for k in range(max(0, min(rem, n))):
            units[k] += 1
        units = [max(0, min(4, u)) for u in units]
        return [LEVELS_ASC[u] for u in units]

    def _result_vals(self, obj, raw):
        """Type-specific result payload from a single raw datapoint."""
        mt = obj.measurement_type
        if mt == "accuracy":
            return {"correct_trials": raw, "total_trials": 10}
        if mt == "prompt_level":
            return {"trial_ids": [
                (0, 0, {"sequence": (k + 1) * 10, "prompt_level": lv})
                for k, lv in enumerate(self._levels_for_avg(raw))
            ]}
        if mt == "duration":
            return {"actual_duration_seconds": raw}
        return {"actual_count": raw}  # frequency_increase / frequency_decrease

    def _done_session(self, student, date, start_h, end_h, obj_raw_pairs):
        session = self.env["educare.session.log"].create({
            "student_id": student.id,
            "teacher_id": self.teacher.id,
            "session_date": date,
            "start_time": start_h,
            "end_time": end_h,
            "session_type": "individual",
            "objective_ids": [(6, 0, [o.id for o, _ in obj_raw_pairs])],
        })
        Result = self.env["educare.session.result"].with_context(
            auto_populate_session_results=True
        )
        for obj, raw in obj_raw_pairs:
            vals = {
                "session_id": session.id,
                "objective_id": obj.id,
                "result_phase": "intervention",
                "teaching_method": "dtt",
            }
            vals.update(self._result_vals(obj, raw))
            Result.create(vals)
        session.write({"status": "done"})
        return session

    def _scheduled_session(self, student, date, start_h, end_h, objectives):
        session = self.env["educare.session.log"].create({
            "student_id": student.id,
            "teacher_id": self.teacher.id,
            "session_date": date,
            "start_time": start_h,
            "end_time": end_h,
            "session_type": "individual",
            "objective_ids": [(6, 0, objectives.ids)],
        })
        session.action_schedule()
        return session

    def _report(self, student, session, summary, achievements):
        self.env["educare.daily.report"].create({
            "student_id": student.id,
            "session_log_id": session.id,
            "report_date": session.session_date,
            "teacher_id": self.teacher.id,
            "status": "sent",
            "report_type": "daily",
            "activity_summary": summary,
            "achievements": achievements,
        })

    # ── An — full IEP covering all 5 measurement types ────────────
    def _build_an(self):
        an = self.env["educare.student"].create({
            "name": "Trần An",
            "student_code": "IEP-DEMO-AN",
            "date_of_birth": "2020-05-10",
            "gender": "male",
            "enrollment_date": self._date(-200),
            "status": "active",
            "primary_diagnosis": "autism",
            "diagnosis_date": "2024-12-20",
            "diagnosed_by": "Bệnh viện Nhi Đồng 1",
            "center_id": self.center.id,
            "assigned_teacher_id": self.teacher.id,
            "supervisor_id": self.supervisor.id,
            "parent_user_id": self.parent.id,
            "parent_name": "Phụ huynh 01",
            "parent_email": "parent01@example.com",
            "parent_relation": "mother",
            "preferred_contact_method": "phone",
            "parent_phone": "0901000001",
            "emergency_contact_phone": "0901000002",
            "learning_style": "visual",
            "communication_level": "single_word",
        })
        plan = self._draft_plan(an, -60, 90)

        g_comm = self._goal(
            plan, "Phát triển giao tiếp bằng lời",
            "educare_base.domain_communication", 15, 80,
        )
        g_beh = self._goal(
            plan, "Cải thiện hành vi trong giờ học",
            "educare_base.domain_behavior", 10, 80,
        )

        o_acc = self._objective(g_comm, "educare_iep.tpl_obj_comm_request_1w", 10)
        o_prompt = self._objective(g_comm, "educare_iep.tpl_obj_comm_request_2w", 20)
        o_dur = self._objective(g_beh, "educare_iep.tpl_obj_behavior_sit", 10)
        o_fdec = self._objective(g_beh, "educare_iep.tpl_obj_behavior_reduce_tantrum", 20)
        o_finc = self._objective(g_beh, "educare_iep.tpl_obj_behavior_request_break", 30)

        self._activate_plan(plan)
        self._activate_goal(g_comm)
        self._activate_goal(g_beh)

        # Per-session raw datapoints (oldest → newest), tuned to show clear
        # progress without crossing the mastery threshold (stays in_progress).
        acc = [3, 4, 4, 5, 5, 6, 5, 6, 6, 7, 6, 7, 7, 7, 8, 7]      # correct / 10
        prm = [25, 30, 35, 40, 45, 45, 50, 50, 55, 55, 60, 60, 62, 62, 65, 62]  # avg %
        dur = [90, 100, 110, 120, 130, 140, 150, 160, 180, 190, 200, 210, 230, 240, 260, 270]
        fdec = [5, 5, 4, 5, 4, 4, 3, 4, 3, 3, 2, 3, 2, 3, 2, 2]      # count (↓ good)
        finc = [0, 0, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1]      # count (↑ good)

        sessions = []
        for i in range(len(acc)):
            sessions.append(self._done_session(
                an, self._date(-50 + i * 3), 8.0, 9.0,
                [
                    (o_acc, acc[i]),
                    (o_prompt, prm[i]),
                    (o_dur, dur[i]),
                    (o_fdec, fdec[i]),
                    (o_finc, finc[i]),
                ],
            ))

        all_objs = o_acc + o_prompt + o_dur + o_fdec + o_finc
        self._scheduled_session(an, self._date(3), 8.0, 9.0, all_objs)
        self._scheduled_session(an, self._date(7), 8.0, 9.0, all_objs)

        for s in sessions[-3:]:
            self._report(
                an, s,
                "Hôm nay bé tham gia đầy đủ các hoạt động giao tiếp và hành vi.",
                "Bé tiến bộ ở kỹ năng yêu cầu bằng lời và ngồi học lâu hơn.",
            )

    # ── Khoa — "one session away from completing IEP" scenario ─────
    def _build_khoa(self):
        khoa = self.env["educare.student"].create({
            "name": "Nguyễn Minh Khoa",
            "student_code": "IEP-DEMO-KHOA",
            "date_of_birth": "2021-03-15",
            "gender": "male",
            "enrollment_date": self._date(-120),
            "status": "active",
            "primary_diagnosis": "autism",
            "center_id": self.center.id,
            "assigned_teacher_id": self.teacher.id,
            "supervisor_id": self.supervisor.id,
            "parent_user_id": self.parent.id,
            "parent_name": "Phụ huynh Nguyễn",
            "parent_phone": "0909111222",
            "emergency_contact_phone": "0909111223",
            "communication_level": "single_word",
        })
        plan = self._draft_plan(khoa, -30, 120)
        goal = self._goal(
            plan, "Giao tiếp bằng lời nói đơn giản",
            "educare_base.domain_communication", 15, 80,
        )
        obj = self._objective(goal, "educare_iep.tpl_obj_comm_request_1w", 10)
        self._activate_plan(plan)
        self._activate_goal(goal)

        # 2 reviewed sessions ≥ 80% → consecutive = 2 (target consecutive = 3)
        self._done_session(khoa, self._date(-10), 14.0, 15.0, [(obj, 8)])
        self._done_session(khoa, self._date(-4), 14.0, 15.0, [(obj, 9)])
        # Teacher evaluates this one live in the app → consecutive = 3 → mastered
        self._scheduled_session(khoa, self._date(0), 14.0, 15.0, obj)
        # Future sessions auto-cancelled when the IEP period is closed
        self._scheduled_session(khoa, self._date(5), 14.0, 15.0, obj)
        self._scheduled_session(khoa, self._date(12), 14.0, 15.0, obj)
