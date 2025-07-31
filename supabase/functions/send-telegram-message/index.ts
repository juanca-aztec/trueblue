import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessageRequest {
  chatId: string;
  message: string;
  conversationId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!telegramBotToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const { chatId, message, conversationId }: TelegramMessageRequest = await req.json();

    // Send message to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramData);
      throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
    }

    console.log('Message sent to Telegram successfully:', telegramData);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: telegramData.result.message_id,
      conversationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-telegram-message function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});