const { createClient } = require('@supabase/supabase-js');
const url = 'https://uarsdrjasjiwkzbekbkt.supabase.co/rest/v1/';
const key = 'sb_publishable_eoy8RWkLmY-pmLTKtDK8sw_NBpKuFUa';
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

supabase
  .from('products')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    console.log(JSON.stringify({ ok: !error, rows: data?.length ?? 0, message: error ? error.message : 'connected' }));
  })
  .catch((e) => {
    console.log(JSON.stringify({ ok: false, message: e.message }));
  });
