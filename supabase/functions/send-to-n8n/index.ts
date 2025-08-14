import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const n8nWebhookUrl = "https://aztec.app.n8n.cloud/webhook/feb40c09-7947-4523-a263-9647125a03ec";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface N8nMessageRequest {
  conversationId: string;
  message: string;
  channel: string;
  senderId: string;
  chatId: string; // ✅ NUEVO CAMPO
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const { conversationId, message, channel, senderId, chatId }: N8nMessageRequest = await req.json();

    console.log(`📤 Enviando mensaje a n8n webhook:`, {
      conversationId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      channel,
      senderId,
      chatId // ✅ NUEVO CAMPO EN LOG
    });

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        message,
        channel,
        senderId,
        chatId // ✅ NUEVO CAMPO EN PAYLOAD
      }),
    });

    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.text();
      console.error('❌ n8n webhook error:', n8nResponse.status, errorData);
      throw new Error(`n8n webhook error: ${n8nResponse.status} - ${errorData}`);
    }

    console.log("✅ Mensaje enviado a n8n webhook exitosamente");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Mensaje enviado a n8n webhook exitosamente",
      conversationId 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error enviando mensaje a n8n:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
