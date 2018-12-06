from opentrons.broker import subscribe, Notifications
from .session import SessionManager, Session
from .calibration import CalibrationManager


class MainRouter:
    def __init__(self, hardware=None, loop=None):
        self._notifications = Notifications(loop=loop)
        self._unsubscribe = []
        self._unsubscribe += [subscribe(
            Session.TOPIC,
            self._notifications.on_notify)]
        self._unsubscribe += [subscribe(
            CalibrationManager.TOPIC,
            self._notifications.on_notify)]

        self.session_manager = SessionManager(hardware=hardware, loop=loop)
        self.calibration_manager = CalibrationManager(hardware=hardware,
                                                      loop=loop)

    @property
    def notifications(self):
        return self._notifications

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        for unsubscribe in self._unsubscribe:
            unsubscribe()
