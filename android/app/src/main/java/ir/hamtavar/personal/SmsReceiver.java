package ir.hamtavar.personal;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    StringBuilder fullBody = new StringBuilder();
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage msg = SmsMessage.createFromPdu((byte[]) pdu);
                            if (msg != null && msg.getMessageBody() != null) {
                                fullBody.append(msg.getMessageBody());
                            }
                        } catch (Exception ignored) {}
                    }
                    String body = fullBody.toString();
                    if (body.contains("واریز") || body.contains("برداشت") || body.contains("خرید") || 
                        body.contains("مانده") || body.contains("موجودی") || body.contains("انتقال") || 
                        body.contains("بانک") || body.contains("کارت")) {
                        
                        if (MainActivity.instance != null) {
                            MainActivity.instance.dispatchIncomingSms(body);
                        }
                    }
                }
            }
        }
    }
}
