import base64
import os
import logging

_logger = logging.getLogger(__name__)

_AVATAR_DIR = os.path.join(os.path.dirname(__file__), "static", "img", "avatar")

_STUDENT_FILES = [f"student_{i:02d}.jpg" for i in range(1, 10)]  # student_01..09


def _load(filename):
    path = os.path.join(_AVATAR_DIR, filename)
    try:
        with open(path, "rb") as fh:
            return base64.b64encode(fh.read())
    except OSError:
        _logger.warning("educare_student: avatar file not found: %s", path)
        return False


def post_init_hook(env):
    """
    After module install:
    1. Assign student avatars, cycling through student1-5.
    2. Fix parent avatars using the gender derived from student.parent_relation
       (overrides the default set by educare_security's hook, which didn't have
       access to student records at install time).
    """
    _seed_student_avatars(env)
    _fix_parent_avatars(env)


def _seed_student_avatars(env):
    student_imgs = [img for img in (_load(f) for f in _STUDENT_FILES) if img]
    if not student_imgs:
        _logger.warning("educare_student: no student avatar images found — skipping")
        return

    students = (
        env["educare.student"]
        .sudo()
        .search([("avatar", "=", False)])
    )
    if not students:
        _logger.info(
            "educare_student: no students without avatar found — skipping student seed"
        )
        return

    for i, student in enumerate(students):
        student.sudo().write({"avatar": student_imgs[i % len(student_imgs)]})

    _logger.info(
        "educare_student post_init_hook: seeded avatars for %d student(s)",
        len(students),
    )


def _fix_parent_avatars(env):
    """
    Update res.users avatar for parent accounts based on the relation stored
    on their linked student record (mother → mom.png, others → father.png).
    First matched student per parent wins; each parent is processed once.
    """
    father_imgs = [img for img in (_load(f) for f in ["father_01.jpg", "father_02.jpg"]) if img]
    mother_imgs = [img for img in (_load(f) for f in ["mother_01.jpg", "mother_02.jpg", "mother_03.jpg"]) if img]
    # Fallback to legacy pngs
    if not father_imgs:
        father_imgs = [img for img in [_load("father.png")] if img]
    if not mother_imgs:
        mother_imgs = [img for img in [_load("mom.png")] if img]

    if not father_imgs and not mother_imgs:
        return

    students = (
        env["educare.student"]
        .sudo()
        .search(
            [
                ("parent_user_id", "!=", False),
                ("parent_relation", "in", ["father", "mother"]),
            ]
        )
    )

    seen_parent_ids = set()
    father_counter = 0
    mother_counter = 0
    updated = 0
    for student in students:
        parent_user = student.parent_user_id
        if parent_user.id in seen_parent_ids:
            continue
        seen_parent_ids.add(parent_user.id)

        if student.parent_relation == "mother":
            if mother_imgs:
                parent_user.sudo().write({"image_1920": mother_imgs[mother_counter % len(mother_imgs)]})
                mother_counter += 1
                updated += 1
        else:
            if father_imgs:
                parent_user.sudo().write({"image_1920": father_imgs[father_counter % len(father_imgs)]})
                father_counter += 1
                updated += 1

    _logger.info(
        "educare_student post_init_hook: fixed parent avatars for %d user(s)", updated
    )
