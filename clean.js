import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrqciegewjemksdabwsf.supabase.co';
const supabaseKey = 'sb_publishable_fvZ5_r2zomWBELF3zzSeEA_MLEvOdxg'; // Using the anon key provided by user, but wait, Anon key cannot delete unless RLS permits.
// RLS for aspirantes: "Permitir todo acceso a aspirantes" -> true. So anon can delete!
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  const { data, error } = await supabase.from('aspirantes').delete().neq('id', 'NONE');
  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Cleaned aspirantes!');
  }
}

clean();
