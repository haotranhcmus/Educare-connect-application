"""
Global constants for educare_session module.

These constants are defined at module level to allow sharing
across multiple models and for easier maintenance.
"""

# Prompt/Support levels in ABA training
# Order matters: index 0 (independent) = best, index 4 (full_physical) = needs most support
PROMPT_LEVELS = [
    ('independent', 'Independent'),
    ('verbal_prompt', 'Verbal Prompt'),
    ('gestural_prompt', 'Gestural Prompt'),
    ('partial_physical', 'Partial Physical Prompt'),
    ('full_physical', 'Full Physical Prompt'),
]

# Extracted keys in order - for index-based comparison
# used_idx <= max_idx => mastery achieved
# used_idx > max_idx => requires more support than allowed
PROMPT_ORDER = [key for key, _ in PROMPT_LEVELS]

# Result/data collection types in ABA
RESULT_TYPES = [
    ('trial_by_trial', 'Trial by Trial'),
    ('probe', 'Probe'),
    ('whole_task', 'Whole Task'),
    ('partial_interval', 'Partial Interval'),
    ('momentary_time_sample', 'Momentary Time Sample'),
]

# Objective-level ABA phase at the moment data is collected.
RESULT_PHASES = [
    ('baseline', 'Baseline'),
    ('intervention', 'Intervention'),
    ('maintenance', 'Maintenance'),
    ('generalization', 'Generalization'),
]

# Teaching method used for a specific objective inside one session.
TEACHING_METHODS = [
    ('dtt', 'Discrete Trial Training (DTT)'),
    ('net', 'Natural Environment Teaching (NET)'),
    ('task_analysis', 'Task Analysis'),
    ('incidental', 'Incidental Teaching'),
    ('errorless', 'Errorless Learning'),
]

# Teacher-rated reinforcement effectiveness for that objective result.
REINFORCEMENT_EFFECTIVENESS = [
    ('high', 'High - Strong learner response'),
    ('medium', 'Medium - Moderate learner response'),
    ('low', 'Low - Limited learner response'),
]

# Session status workflow
SESSION_STATUS = [
    ('draft', 'Draft'),
    ('scheduled', 'Scheduled'),
    ('completed', 'Completed'),
    ('done', 'Reviewed'),
]

ATTENDANCE_STATUS = [
    ('present', 'Present'),
    ('absent_excused', 'Absent (Excused)'),
    ('absent_unexcused', 'Absent (Unexcused)'),
    ('cancelled_center', 'Cancelled by Center'),
    ('cancelled_family', 'Cancelled by Family'),
]

# Environmental factors during session
MOOD_LEVELS = [
    ('very_good', 'Very Good'),
    ('good', 'Good'),
    ('neutral', 'Neutral'),
    ('difficult', 'Difficult'),
    ('very_difficult', 'Very Difficult'),
]

ENERGY_LEVELS = [
    ('high', 'High'),
    ('normal', 'Normal'),
    ('low', 'Low'),
]

ENGAGEMENT_LEVELS = [
    ('highly_engaged', 'Highly Engaged'),
    ('engaged', 'Engaged'),
    ('somewhat_engaged', 'Somewhat Engaged'),
    ('disengaged', 'Disengaged'),
]

PERFORMANCE_LEVELS = [
    ('excellent', 'Excellent'),
    ('good', 'Good'),
    ('fair', 'Fair'),
    ('poor', 'Needs Improvement'),
]

LOCATIONS = [
    ('center', 'Center'),
    ('home', 'Home'),
    ('school', 'School'),
    ('online', 'Online'),
]

SESSION_TYPES = [
    ('individual', '1:1 (Individual)'),
    ('small_group', 'Small Group (2-4 Learners)'),
    ('consultation', 'Consultation'),
]

HOME_PRACTICE_STATUS = [
    ('yes', 'Completed Fully'),
    ('partial', 'Completed Partially'),
    ('no', 'Not Completed'),
    ('not_assigned', 'Not Assigned'),
]
