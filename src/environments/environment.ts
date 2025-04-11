// src/environments/environment.ts
export const environment = {
    production: false,
    supabaseUrl: 'https://mpadnohtgurnpsiyrkta.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wYWRub2h0Z3VybnBzaXlya3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjE1MzIsImV4cCI6MjA1NjIzNzUzMn0.-44qJhPcXk4ib6jpyCHuuyabt8j6V7zqa7y_ZrjmvJE',
    woocommerceCredentials: {
      resay: {
        consumerKey: 'ck_your_consumer_key_for_resay',
        consumerSecret: 'cs_your_consumer_secret_for_resay'
      },
      androidEpos: {
        consumerKey: 'ck_your_consumer_key_for_android_epos',
        consumerSecret: 'cs_your_consumer_secret_for_android_epos'
      },
      barcode: {
        consumerKey: 'ck_your_consumer_key_for_barcode',
        consumerSecret: 'cs_your_consumer_secret_for_barcode'
      }
    }
  };

//   // src/environments/environment.prod.ts
//   export const environment = {
//     production: true,
//     supabaseUrl: 'YOUR_SUPABASE_URL',
//     supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
//   };