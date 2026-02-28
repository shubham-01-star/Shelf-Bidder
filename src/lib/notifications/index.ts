/**
 * Notifications Module Exports
 * Task 7: Push Notifications and Voice System
 */

export {
  requestPermission,
  isPermissionGranted,
  sendNotification,
  scheduleMorningNotifications,
  msUntilHour,
  type NotificationType,
  type NotificationPayload,
} from './push-service';

export {
  initiateVoiceCall,
  generateVoiceMessage,
  playAudioNotification,
  speakText,
  type VoiceCallRequest,
  type VoiceMessage,
  type VoiceCallResult,
} from './voice-service';
