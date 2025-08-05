import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useMessageTemplates, MessageTemplate } from '@/hooks/useMessageTemplates';

interface MessageTemplatesSuggestionsProps {
  onSelectTemplate: (template: MessageTemplate) => void;
  className?: string;
}

export function MessageTemplatesSuggestions({ 
  onSelectTemplate, 
  className = "" 
}: MessageTemplatesSuggestionsProps) {
  const { templates } = useMessageTemplates();
  const [isOpen, setIsOpen] = useState(false);

  if (templates.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Plantillas de mensajes</span>
            <Badge variant="secondary" className="ml-2">
              {templates.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 mt-2">
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex flex-col items-start gap-1 overflow-hidden">
                    <div className="font-medium text-sm truncate w-full">
                      {template.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {template.message}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}