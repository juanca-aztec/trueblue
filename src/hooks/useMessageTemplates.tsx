import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface MessageTemplate {
  id: string;
  title: string;
  message: string;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  { 
    id: "1", 
    title: "Saludo personal", 
    message: "¡Hola! Soy {name}, ¿en qué te puedo ayudar hoy?" 
  },
  { 
    id: "2", 
    title: "Mensaje de espera", 
    message: "Gracias por tu paciencia. Un agente se pondrá en contacto contigo pronto." 
  },
  { 
    id: "3", 
    title: "Despedida personal", 
    message: "Gracias por contactarnos. Soy {name} y ha sido un placer ayudarte. ¡Que tengas un excelente día!" 
  },
];

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const { toast } = useToast();

  // Load templates from localStorage on init
  useEffect(() => {
    const stored = localStorage.getItem('message-templates');
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading templates from localStorage:', error);
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('message-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const addTemplate = (title: string, message: string) => {
    if (!title.trim() || !message.trim()) return false;
    
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      title: title.trim(),
      message: message.trim(),
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Plantilla agregada",
      description: "La nueva plantilla de mensaje se ha guardado.",
    });
    
    return true;
  };

  const updateTemplate = (id: string, updates: Partial<MessageTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updates } : template
    ));
    
    toast({
      title: "Plantilla actualizada",
      description: "Los cambios se han guardado correctamente.",
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
    
    toast({
      title: "Plantilla eliminada",
      description: "La plantilla se ha eliminado correctamente.",
    });
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}