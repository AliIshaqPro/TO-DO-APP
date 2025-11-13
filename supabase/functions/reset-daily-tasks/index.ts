import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Reset all recurring tasks by setting completed to false
    const { error } = await supabaseClient
      .from('tasks')
      .update({ 
        completed: false,
        completed_at: null 
      })
      .eq('recurring', true)
      .eq('completed', true)

    if (error) {
      console.error('Error resetting tasks:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully reset recurring tasks')
    return new Response(
      JSON.stringify({ message: 'Recurring tasks reset successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
