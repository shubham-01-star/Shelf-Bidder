import { NextResponse } from 'next/server';
import { initiateVoiceCall } from '@/lib/notifications/voice-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopkeeperId, phoneNumber, language, messageType, productName, brandName, earnings, instructions } = body;

    if (!shopkeeperId || !phoneNumber || !messageType || !productName || !brandName || earnings === undefined) {
      return NextResponse.json(
        { error: 'Missing required voice call fields' },
        { status: 400 }
      );
    }

    const voiceResult = await initiateVoiceCall({
      shopkeeperId,
      phoneNumber,
      language: language || 'hi-IN',
      message: {
        type: messageType,
        productName,
        brandName,
        earnings,
        instructions
      }
    });

    return NextResponse.json(voiceResult);
  } catch (error) {
    console.error('API Voice Notification Error:', error);
    return NextResponse.json(
      { error: 'Internal server error triggering voice call' },
      { status: 500 }
    );
  }
}
