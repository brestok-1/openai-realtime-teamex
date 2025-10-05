import { tool } from '@openai/agents';
import { z } from 'zod';
import { BackendTool, BackendToolParameter } from '../api/types';

function convertToZodSchema(properties: Record<string, BackendToolParameter>): z.ZodObject<any> {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(z.any());
        break;
      case 'object':
        zodType = z.object({});
        break;
      default:
        zodType = z.any();
    }

    if (prop.enum) {
      zodType = z.enum(prop.enum as [string, ...string[]]);
    }

    if (prop.description) {
      zodType = zodType.describe(prop.description);
    }

    if (!prop.required) {
      zodType = zodType.optional();
    }

    schemaFields[key] = zodType;
  }

  return z.object(schemaFields);
}

function getToolExecutor(toolName: string) {
  switch (toolName) {
    case 'coach_tip':
      return async (input: any) => {
        alert(`Coach tip: ${input.tip}`);
        return `Coaching tip delivered: ${input.tip}`;
      };
    case 'end_call':
      return async () => {
        alert('Call ended');
        return 'Call ended successfully';
      };
    default:
      return async (input: any) => {
        console.log(`Tool ${toolName} executed with input:`, input);
        return `Tool ${toolName} executed successfully`;
      };
  }
}

export function buildToolsFromBackend(backendTools: BackendTool[]) {
  return backendTools.map((backendTool) => {
    const zodSchema = convertToZodSchema(backendTool.parameters.properties);
    
    return tool({
      name: backendTool.name,
      description: backendTool.description,
      parameters: zodSchema,
      execute: getToolExecutor(backendTool.name),
    });
  });
}
