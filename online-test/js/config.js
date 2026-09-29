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
  // Online "play with a friend" (js/online.js): the network servers two browsers use to find a direct route to each
  // other (WebRTC iceServers). Free public STUN only for now. A TURN relay (for players whose network allows no direct
  // route, e.g. some mobile operators) is added here, no code change needed, e.g.
  //   { urls: ['turn:turn.example.com:3478', 'turns:turn.example.com:5349'], username: '…', credential: '…' }
  ICE_SERVERS: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
}, window.ND.CONFIG || {});
