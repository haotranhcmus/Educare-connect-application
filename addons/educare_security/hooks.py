import base64
import os
import logging

_logger = logging.getLogger(__name__)

_AVATAR_DIR = os.path.join(os.path.dirname(__file__), "static", "img", "avatar")


def _load(filename):
    path = os.path.join(_AVATAR_DIR, filename)
    try:
        with open(path, "rb") as fh:
            return base64.b64encode(fh.read())
    except OSError:
        _logger.warning("educare_security: avatar file not found: %s", path)
        return False


def post_init_hook(env):
    """
    Set default avatars for all educare user profiles after module install.

    - teacher / supervisor / admin  → teacher.png
    - parent (relation = mother)    → mom.png
    - parent (other / not set)      → father.png

    Only users that have no custom avatar (image_1920 is False) are updated.
    """
    teacher_img = _load("teacher.png")
    father_img = _load("father.png")
    mom_img = _load("mom.png")

    if not any([teacher_img, father_img, mom_img]):
        _logger.error(
            "educare_security: no avatar images found in %s — skipping seed",
            _AVATAR_DIR,
        )
        return

    profiles = (
        env["educare.user.profile"]
        .sudo()
        .search([("user_id", "!=", False)])
    )

    updated = 0
    for profile in profiles:
        user = profile.user_id
        # Skip users that already have a real avatar
        if user.image_1920:
            continue

        if profile.role in ("teacher", "supervisor", "admin"):
            img = teacher_img
        elif profile.role == "parent":
            img = mom_img if profile.parent_relation == "mother" else father_img
        else:
            continue

        if img:
            user.sudo().write({"image_1920": img})
            updated += 1

    _logger.info(
        "educare_security post_init_hook: seeded avatars for %d user(s)", updated
    )
