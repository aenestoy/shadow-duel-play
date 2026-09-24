// Gölge Düellosu — çevrimiçi sıralama ayarları (Supabase)
//
// Nasıl doldurulur: supabase/KURULUM.md dosyasındaki adımları izleyin.
//   SUPABASE_URL      → Supabase panelinde Project Settings → API (ya da "Connect") içindeki "Project URL"
//                       örnek: 'https://abcdefghijklmno.supabase.co'
//   SUPABASE_ANON_KEY → aynı sayfadaki "anon public" anahtarı (eyJ… ile başlar) ya da yeni
//                       "Publishable key" (sb_publishable_… ile başlar). Bu anahtar herkese açık olacak
//                       şekilde tasarlanmıştır; tarayıcıda görünmesi sorun değildir.
//
// UYARI: "service_role" ya da "secret" anahtarını ASLA buraya yazmayın. O anahtar veritabanının tamamını
// açar ve oyunun kodunu indiren herkes onu görebilir.
//
// İkisi de boş kalırsa oyun çevrimiçi tabloyu kullanmaz: yerel tabloya (ya da claude.ai içinde Claude tablosuna) düşer.
window.ND = window.ND || {};
window.ND.CONFIG = Object.assign({
  SUPABASE_URL: 'https://cjaewbrifdqlykasrkds.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_rRU01BBLtAH5ecd6nGEWDw_JiUWDrjI',
}, window.ND.CONFIG || {});
