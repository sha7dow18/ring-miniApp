const agentService = require('../miniprogram/services/agentService.js')

describe('agentService helpers', () => {
  test('normalizeToolCall parses function arguments', () => {
    const call = agentService.normalizeToolCall({
      tool_call: {
        id: 'call_1',
        function: {
          name: 'get_health_summary',
          arguments: '{"days":7}'
        }
      }
    })

    expect(call).toEqual({
      toolCallId: 'call_1',
      name: 'get_health_summary',
      args: { days: 7 },
      status: 'executing'
    })
  })

  test('normalizeToolResult keeps structured result and summary', () => {
    const result = agentService.normalizeToolResult({
      type: 'tool-result',
      toolCallId: 'call_1',
      toolName: 'recommend_products',
      args: { limit: 3 },
      result: {
        items: [{ id: 'm1' }, { id: 'm2' }]
      }
    })

    expect(result.status).toBe('completed')
    expect(result.summary).toContain('2 个商品')
  })
})
