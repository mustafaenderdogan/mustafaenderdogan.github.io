/* Büro: Emsal karar arama (demo eklentisi)
   - Karar havuzu SENTETİKTİR: gerçek karar değildir, künyeler "ÖRN-" ile başlar.
   - İlke: müvekkil verisi büroda kalır. Arama servisine yalnızca maskelenmiş "sorgu paketi" gider.
   - Arama: Türkçe kaba gövdeleme + BM25 + kanun maddesi ve konu eşleşmesi bonusu (canlıda: BM25 + yerel vektör modeli).
   Bağlantı: window.BuroApp genişletme noktaları (NAV, VIEWS, TABS, FILE_ACTIONS). */
(function () {
  "use strict";
  var A = window.BuroApp;
  if (!A) return;

  /* ---------- 1. Sentetik karar havuzu ---------- */
  var KAYNAK = { yuksek: "Yüksek mahkeme", bam: "Bölge adliye", idari: "İdari yargı", kurul: "Kurul kararı" };
  var K = [
    ["ÖRN-01", "yuksek", "İş uyuşmazlıkları dairesi", "2024-03-14", "Bozma", "İşçilik alacağı", ["İK 41"], ["fazla çalışma", "tanık beyanı", "hakkaniyet indirimi"],
      "Fazla çalışmanın yalnızca tanık beyanıyla belirlendiği dosyada hakkaniyet indirimi yapılmadan hüküm kurulması bozma nedeni sayıldı.",
      "Davacının haftalık 45 saati aşan çalışması imzalı belgelerle değil, aynı işyerinde çalışmış tanıkların anlatımlarıyla belirlenmiştir. Tanık beyanına dayanılarak hesaplanan fazla çalışma alacağında, işçinin her gün aynı tempoda çalışmasının olağan hayat akışına uygun olmadığı gözetilerek makul oranda hakkaniyet indirimi yapılmalıdır. İndirim yapılmaksızın hesaplanan tutarın tamamına hükmedilmesi hatalıdır."],
    ["ÖRN-02", "yuksek", "İş uyuşmazlıkları dairesi", "2023-06-02", "Onama", "İşçilik alacağı", ["İK 41"], ["fazla çalışma", "imzalı bordro", "ihtirazi kayıt"],
      "Fazla çalışma tahakkuku bulunan ve ihtirazi kayıt konmadan imzalanan bordrolar karşısında, daha fazla çalışmanın yazılı delille ispatı gerektiği kabul edildi.",
      "Bordrolarda fazla çalışma sütununda tahakkuk bulunduğu ve işçinin bu bordroları ihtirazi kayıt koymaksızın imzaladığı anlaşılmaktadır. Bu durumda bordroda gösterilenden daha fazla çalışma yapıldığı ancak yazılı delille ispatlanabilir; tanık beyanı tek başına yeterli değildir. Mahkemenin bu yöndeki değerlendirmesi yerindedir."],
    ["ÖRN-03", "bam", "Hukuk dairesi (iş)", "2025-01-21", "Kısmen kabul", "İşçilik alacağı", ["1475 s.K. 14", "İK 17", "İK 24"], ["kıdem tazminatı", "haklı fesih", "ücretin ödenmemesi", "ihbar tazminatı"],
      "Ücretleri düzenli ödenmeyen işçinin sözleşmeyi haklı nedenle feshettiği, kıdem tazminatına hak kazandığı ancak fesheden taraf olduğundan ihbar tazminatı isteyemeyeceği belirtildi.",
      "Banka kayıtlarından ücretlerin birden çok ay gecikmeli ve eksik ödendiği anlaşılmaktadır. Bu durum işçiye sözleşmeyi derhal feshetme hakkı verir ve işçi kıdem tazminatına hak kazanır. Ancak sözleşmeyi fesheden işçi olduğundan ihbar tazminatı talebinin reddi gerekir."],
    ["ÖRN-04", "yuksek", "İş uyuşmazlıkları dairesi", "2022-11-08", "Bozma", "İşçilik alacağı", ["İK 59"], ["yıllık izin ücreti", "zamanaşımı", "sözleşmenin sona ermesi"],
      "Kullandırılmayan yıllık izin ücretinde zamanaşımının iş sözleşmesinin sona erdiği tarihten başlayacağı vurgulandı.",
      "Yıllık izin ücreti, iş sözleşmesinin herhangi bir nedenle sona ermesiyle muaccel hale gelir. Bu nedenle zamanaşımı, izinlerin hak edildiği yıllardan değil sözleşmenin sona erdiği tarihten itibaren başlatılmalıdır. Zamanaşımı itirazının bu yönden değerlendirilmeden kabulü hatalıdır."],
    ["ÖRN-05", "yuksek", "İş uyuşmazlıkları dairesi", "2024-09-17", "Onama", "İşe iade", ["İK 18", "İK 20", "7036 s.K. 3"], ["işe iade", "geçerli neden", "performans düşüklüğü", "savunma alınması"],
      "Performans düşüklüğüne dayanan fesihte işverenin objektif ölçütleri ve savunma alındığını ispatlayamadığı; feshin geçersiz olduğu kabul edildi.",
      "Performans düşüklüğünün geçerli fesih nedeni sayılabilmesi için önceden bilinen, ölçülebilir hedeflerin belirlenmesi ve işçinin savunmasının alınması gerekir. Dosyada ölçütlerin işçiye bildirildiğine ve savunma istendiğine dair belge yoktur. Feshin geçersizliğine ve işe iadeye karar verilmesi yerindedir."],
    ["ÖRN-06", "bam", "Hukuk dairesi (iş)", "2023-04-11", "Ret", "İşe iade", ["7036 s.K. 3"], ["arabuluculuk dava şartı", "işe iade", "usulden ret"],
      "Arabulucuya başvurulmadan açılan işe iade davası dava şartı yokluğundan usulden reddedildi.",
      "İşe iade taleplerinde arabulucuya başvurmuş olmak dava şartıdır. Davacının arabuluculuk son tutanağını sunmadığı ve süresinde başvuru yapmadığı anlaşılmaktadır. Dava şartı yokluğu nedeniyle davanın usulden reddine karar verilmiştir."],
    ["ÖRN-07", "yuksek", "Hukuk dairesi (kira)", "2024-05-29", "Bozma", "Kira tespiti", ["TBK 344"], ["kira tespiti", "beş yıllık süre", "hakkaniyet indirimi", "emsal kira"],
      "Beş yılı aşan kira ilişkisinde yeni bedel belirlenirken emsal kira bedelleri ile hakkaniyet indiriminin birlikte değerlendirilmesi gerektiği belirtildi.",
      "Kira ilişkisi beş yılı aşmıştır. Bu durumda yeni kira bedeli; kiralananın durumu, emsal kira bedelleri ve endeks değişimi göz önüne alınarak hakkaniyete göre belirlenir. Mahkemece yalnızca emsal kira bedeline itibar edilip, kiracının uzun süreli kullanımı nedeniyle uygun bir hakkaniyet indirimi yapılmaması hatalıdır."],
    ["ÖRN-08", "yuksek", "Hukuk dairesi (kira)", "2023-02-07", "Onama", "Kira tespiti", ["TBK 344"], ["kira tespiti", "TÜFE", "on iki aylık ortalama", "konut kirası"],
      "Beş yıldan kısa kira ilişkisinde artışın, önceki kira yılının TÜFE on iki aylık ortalamasını aşamayacağı kabul edildi.",
      "Taraflar arasındaki kira ilişkisi beş yılı doldurmamıştır. Bu durumda kira artışı, bir önceki kira yılında tüketici fiyat endeksindeki on iki aylık ortalamalara göre değişim oranını geçemez. Mahkemenin bu sınırı gözeterek bedeli belirlemesi yerindedir."],
    ["ÖRN-09", "bam", "Hukuk dairesi (kira)", "2025-06-18", "Kısmen kabul", "Kira tespiti", ["TBK 344", "HMK 266"], ["bilirkişi raporu", "emsal kira", "gerekçesiz rapor", "kira tespiti"],
      "Emsal taşınmazların konum ve nitelik farklarını açıklamayan bilirkişi raporuna dayanılarak karar verilemeyeceği belirtildi.",
      "Bilirkişi raporunda gösterilen emsallerin kiralananla konum, büyüklük ve nitelik bakımından nasıl karşılaştırıldığı açıklanmamıştır. Denetime elverişli olmayan rapora dayanılarak kira bedeli belirlenemez. Ek rapor alınarak emsallerin karşılaştırılması gerekir."],
    ["ÖRN-10", "yuksek", "Hukuk dairesi (kira)", "2022-09-26", "Onama", "Kira alacağı", ["İİK 269", "TBK 315"], ["kira alacağı", "tahliye", "temerrüt", "ödeme emri"],
      "Ödeme emrine rağmen süresinde ödenmeyen kira nedeniyle verilen tahliye kararı onandı.",
      "Kiracıya tebliğ edilen ödeme emrinde birikmiş kira bedelinin otuz gün içinde ödenmesi aksi halde tahliye isteneceği ihtar edilmiştir. Kiracı süresinde ödeme yapmamış ve temerrüde düşmüştür. Temerrüt nedeniyle tahliyeye karar verilmesi usul ve yasaya uygundur."],
    ["ÖRN-11", "yuksek", "Hukuk dairesi (tazminat)", "2024-01-30", "Bozma", "Tazminat (trafik kazası)", ["KTK 85", "TBK 52"], ["müterafik kusur", "emniyet kemeri", "kusur indirimi", "maddi tazminat"],
      "Emniyet kemeri takılmamasının zararın artmasına etkisi uzman bilirkişiyle belirlenmeden müterafik kusur indirimi yapılamayacağı belirtildi.",
      "Davalı, yolcunun emniyet kemeri takmadığını ileri sürerek indirim istemiştir. Kemer takılmamasının yaralanmanın oluşumuna ya da ağırlaşmasına etkisi tıbbi ve teknik açıdan uzman bilirkişi raporuyla belirlenmeden, yalnızca bu olguya dayanarak indirim yapılması hatalıdır."],
    ["ÖRN-12", "yuksek", "Hukuk dairesi (tazminat)", "2025-03-04", "Kısmen kabul", "Tazminat (trafik kazası)", ["TBK 53", "KTK 91"], ["destekten yoksunluk", "aktüerya hesabı", "sigorta limiti", "yaşam tablosu"],
      "Destekten yoksunluk tazminatında güncel yaşam tablosu ve poliçe limitiyle sınırlı sorumluluk ilkesi uygulandı.",
      "Destekten yoksunluk tazminatı, desteğin bakiye ömrü ve destek oranı esas alınarak aktüerya yöntemiyle hesaplanmalıdır. Sigorta şirketinin sorumluluğu kaza tarihindeki poliçe limitiyle sınırlıdır. Bilirkişi raporu bu ilkelere uygun olduğundan hükme esas alınmıştır."],
    ["ÖRN-13", "bam", "Hukuk dairesi (tazminat)", "2023-10-12", "Düzelterek onama", "Tazminat (trafik kazası)", ["TBK 56"], ["manevi tazminat", "kalıcı maluliyet", "hakkaniyet", "zenginleşme aracı"],
      "Kalıcı maluliyet halinde manevi tazminatın, zenginleşme aracı olmayacak ve hakkaniyete uygun bir miktarda belirlenmesi gerektiği vurgulandı.",
      "Manevi tazminat, kişinin yaşadığı acı ve elemi kısmen gidermeye yöneliktir; bir zenginleşme aracı değildir. Olayın oluş biçimi, maluliyet oranı ve tarafların ekonomik durumu birlikte değerlendirilerek miktar yeniden belirlenmiştir."],
    ["ÖRN-14", "yuksek", "Hukuk dairesi (aile)", "2024-07-09", "Bozma", "Boşanma ve velayet", ["TMK 182", "TMK 336"], ["velayet", "çocuğun üstün yararı", "idrak çağı", "çocuğun dinlenmesi", "sosyal inceleme raporu"],
      "İdrak çağındaki çocuk uzman eşliğinde dinlenmeden velayet düzenlemesi yapılması bozma nedeni sayıldı.",
      "Velayet düzenlemesinde belirleyici ölçüt çocuğun üstün yararıdır. İdrak çağındaki çocuğun görüşünün uzman eşliğinde alınması ve sosyal inceleme raporuyla birlikte değerlendirilmesi gerekir. Çocuk dinlenmeden velayetin bir tarafa verilmesi eksik incelemedir."],
    ["ÖRN-15", "yuksek", "Hukuk dairesi (aile)", "2023-12-05", "Onama", "Boşanma ve velayet", ["TMK 166", "TMK 174"], ["evlilik birliğinin sarsılması", "kusur", "maddi tazminat", "manevi tazminat"],
      "Evlilik birliğinin temelinden sarsıldığı ve ağır kusurlu eşin tazminat ödemesi gerektiği kabul edildi.",
      "Tanık beyanlarından taraflar arasında ortak hayatın sürdürülemeyecek derecede sarsıldığı anlaşılmaktadır. Kusur belirlemesi dosya kapsamına uygundur. Daha ağır kusurlu eş aleyhine maddi ve manevi tazminata hükmedilmesi yerindedir."],
    ["ÖRN-16", "bam", "Hukuk dairesi (tüketici)", "2024-10-22", "Kabul", "Ayıplı mal", ["TKHK 8", "TKHK 11"], ["ayıplı mal", "seçimlik haklar", "bedel iadesi", "gizli ayıp"],
      "Tüketicinin seçimlik hakkını sözleşmeden dönme yönünde kullandığı, ayıbın gizli ayıp niteliğinde olduğu ve bedelin iadesi gerektiği kabul edildi.",
      "Bilirkişi raporuyla aracın teslim anında var olan ve olağan incelemeyle anlaşılamayacak bir üretim hatası taşıdığı belirlenmiştir. Tüketici seçimlik haklarından sözleşmeden dönmeyi seçmiştir. Bu durumda satış bedelinin iadesine karar verilmesi gerekir."],
    ["ÖRN-17", "bam", "Hukuk dairesi (tüketici)", "2023-05-16", "Ret", "Ayıplı mal", ["TKHK 68"], ["tüketici hakem heyeti", "parasal sınır", "dava şartı"],
      "Parasal sınırın altındaki uyuşmazlıkta tüketici hakem heyetine başvurulmadan açılan dava usulden reddedildi.",
      "Uyuşmazlığın değeri, dava tarihinde yürürlükte olan parasal sınırın altındadır. Bu tür uyuşmazlıklarda tüketici hakem heyetine başvuru zorunludur. Başvuru yapılmadan doğrudan dava açıldığından davanın usulden reddi gerekir."],
    ["ÖRN-18", "yuksek", "Hukuk dairesi (tüketici)", "2022-04-19", "Bozma", "Ayıplı mal", ["TKHK 12"], ["zamanaşımı", "ayıp ihbarı", "ağır kusur", "gizleme"],
      "Satıcının ayıbı ağır kusuruyla gizlediği hallerde iki yıllık zamanaşımı süresinin uygulanamayacağı belirtildi.",
      "Ayıplı maldan doğan sorumluluk kural olarak teslimden itibaren iki yıllık zamanaşımına tabidir. Ancak ayıp satıcının ağır kusuru ya da hilesiyle gizlenmişse bu süre uygulanmaz. Mahkemenin gizleme iddiasını incelemeden zamanaşımı nedeniyle ret kararı vermesi hatalıdır."],
    ["ÖRN-19", "idari", "İdare mahkemesi", "2025-02-12", "Kabul", "İmar para cezasının iptali", ["3194 s.K. 42", "İYUK 7"], ["imar para cezası", "yapı tatil tutanağı", "yerinde tespit", "ruhsata aykırılık"],
      "Yerinde tespit ve yapı tatil tutanağı bulunmadan verilen imar para cezası iptal edildi.",
      "İmar para cezasının dayanağı olan aykırılığın, yerinde yapılan tespit ve buna ilişkin tutanakla somut olarak ortaya konulması gerekir. Dosyada yalnızca hava fotoğrafına dayanıldığı, yerinde tespit yapılmadığı anlaşılmaktadır. Eksik incelemeye dayalı işlemde hukuka uyarlık bulunmamaktadır."],
    ["ÖRN-20", "idari", "İdare mahkemesi", "2023-08-30", "Ret", "İmar para cezasının iptali", ["3194 s.K. 32", "3194 s.K. 42"], ["ruhsatsız yapı", "encümen kararı", "yıkım", "imar para cezası"],
      "Ruhsatsız olarak yapılan ek kat için verilen encümen kararı ve para cezası hukuka uygun bulundu.",
      "Yerinde yapılan tespitte ruhsat ve eklerine aykırı olarak ek kat inşa edildiği tutanakla belirlenmiştir. Yapı tatil tutanağı usulüne uygun tebliğ edilmiş ve süresinde aykırılık giderilmemiştir. Encümen kararıyla yıkım ve para cezası verilmesinde hukuka aykırılık yoktur."],
    ["ÖRN-21", "idari", "İdari dava daireleri", "2024-11-06", "Bozma", "İmar para cezasının iptali", ["İYUK 7"], ["dava açma süresi", "tebliğ", "e-tebligat", "süre aşımı"],
      "Dava açma süresinin elektronik tebligatın muhataba ulaştığı kabul edilen tarihten başlayacağı belirtildi.",
      "Elektronik yolla yapılan tebligatlarda tebliğ, muhatabın adresine ulaştığı tarihi izleyen beşinci günün sonunda yapılmış sayılır. Dava açma süresinin bu tarihten itibaren hesaplanması gerekirken, gönderim tarihinin esas alınarak davanın süre aşımı nedeniyle reddi hatalıdır."],
    ["ÖRN-22", "idari", "Vergi mahkemesi", "2024-04-24", "Kısmen kabul", "Vergi ziyaı cezasının iptali", ["VUK 341", "VUK 344"], ["vergi ziyaı cezası", "sahte belge", "kullanma iradesi", "vergi inceleme raporu"],
      "Sahte fatura kullanımında mükellefin bilerek kullandığı somut olarak ortaya konulmadan üç kat vergi ziyaı cezası uygulanamayacağı belirtildi.",
      "Vergi inceleme raporunda faturaları düzenleyen firmanın sahte belge düzenlediği tespit edilmiş, ancak davacının bu durumu bildiğine ilişkin somut tespit yapılmamıştır. Tarhiyat yerinde olmakla birlikte cezanın bir kat üzerinden uygulanması gerekir."],
    ["ÖRN-23", "idari", "Vergi mahkemesi", "2022-12-14", "Ret", "Vergi ziyaı cezasının iptali", ["VUK 359", "VUK 344"], ["sahte belge", "mal hareketi", "ödeme kaydı", "vergi ziyaı cezası"],
      "Mal hareketi ve ödeme kayıtlarıyla desteklenmeyen faturaların gerçek bir alım-satımı yansıtmadığı kabul edildi.",
      "Davacı, faturalara konu malların fiilen teslim alındığını gösteren sevk irsaliyesi, taşıma belgesi ya da bankacılık kanalıyla ödeme kaydı sunamamıştır. Bu durumda faturaların gerçek bir emtia teslimine dayanmadığı sonucuna varılmış, tarhiyat ve ceza hukuka uygun bulunmuştur."],
    ["ÖRN-24", "yuksek", "Hukuk dairesi (ticaret)", "2024-02-20", "Bozma", "İtirazın iptali", ["İİK 67"], ["itirazın iptali", "icra inkâr tazminatı", "likit alacak", "yargılamayı gerektirme"],
      "Miktarı ancak bilirkişi incelemesiyle belirlenebilen alacağın likit olmadığı, icra inkâr tazminatına hükmedilemeyeceği belirtildi.",
      "İcra inkâr tazminatına hükmedilebilmesi için alacağın likit, yani borçlu tarafından hesaplanabilir ve belirlenebilir olması gerekir. Alacak miktarı ancak kapsamlı bilirkişi incelemesiyle ortaya çıkmıştır. Bu durumda tazminat talebinin reddi gerekir."],
    ["ÖRN-25", "bam", "Hukuk dairesi (ticaret)", "2025-04-08", "Kabul", "İtirazın iptali", ["İİK 67", "TTK 21"], ["cari hesap", "ticari defter", "fatura", "sekiz günlük itiraz"],
      "Sekiz gün içinde itiraz edilmeyen faturalar ve tarafların ticari defter kayıtlarıyla alacağın ispatlandığı kabul edildi.",
      "Davacının faturaları davalıya tebliğ edilmiş, davalı sekiz gün içinde itiraz etmemiştir. Her iki tarafın ticari defter kayıtları da cari hesap bakiyesini doğrulamaktadır. İtirazın iptaline ve takibin devamına karar verilmesi yerindedir."],
    ["ÖRN-26", "yuksek", "Hukuk dairesi (ticaret)", "2023-03-28", "Onama", "Menfi tespit", ["İİK 72"], ["menfi tespit", "kambiyo senedi", "bedelsizlik", "yazılı delil"],
      "Kambiyo senedinin bedelsiz kaldığı iddiasının yazılı delille ispatlanması gerektiği kabul edildi.",
      "Senet metninde bedelin nakden ya da malen alındığı yazılıdır. Bu kayda karşı bedelsizlik iddiası ancak yazılı delille ispatlanabilir; tanık dinlenemez. Davacı yazılı delil sunamadığından davanın reddi isabetlidir."],
    ["ÖRN-27", "bam", "Hukuk dairesi (ticaret)", "2024-08-15", "Kısmen kabul", "Menfi tespit", ["İİK 72"], ["menfi tespit", "kötüniyet tazminatı", "ihtiyati tedbir", "teminat"],
      "Borçlu olunmadığı tespit edilmekle birlikte alacaklının kötüniyeti ispatlanamadığından kötüniyet tazminatı talebi reddedildi.",
      "Dosya kapsamından davacının takip konusu senetten dolayı borçlu olmadığı anlaşılmıştır. Ancak alacaklının takibe kötüniyetle giriştiği kanıtlanamamıştır. Bu nedenle menfi tespit talebinin kabulüne, kötüniyet tazminatı talebinin reddine karar verilmiştir."],
    ["ÖRN-28", "yuksek", "Hukuk dairesi (ticaret)", "2025-05-13", "Bozma", "Alacak", ["TBK 117", "3095 s.K. 2"], ["temerrüt", "ticari faiz", "avans faizi", "ihtar"],
      "Ticari işten doğan alacakta temerrüt tarihinden itibaren avans faizi uygulanması gerektiği belirtildi.",
      "Taraflar arasındaki ilişki her iki taraf için ticari iştir. Ticari işlerde taraflar faiz oranını kararlaştırmamışsa temerrüt faizi avans faizi oranında uygulanır. Mahkemece yasal faize hükmedilmesi hatalıdır; temerrüt de ihtarnamenin tebliğiyle gerçekleşmiştir."],
    ["ÖRN-29", "bam", "Hukuk dairesi (ticaret)", "2023-11-21", "Kabul", "Alacak", ["TBK 470", "TBK 474"], ["eser sözleşmesi", "bakiye alacak", "ayıp ihbarı", "teslim"],
      "Eserin teslim alınıp süresinde ayıp ihbarı yapılmadığından yüklenicinin bakiye iş bedeli alacağı kabul edildi.",
      "İş sahibi eseri teslim almış ve olağan inceleme süresi içinde ayıp ihbarında bulunmamıştır. Bu durumda eser kabul edilmiş sayılır. Yüklenicinin bakiye iş bedeli alacağının tahsiline karar verilmesi yerindedir."],
    ["ÖRN-30", "yuksek", "Hukuk dairesi (icra)", "2024-06-25", "Bozma", "Kambiyo senedi (bono)", ["İİK 168", "İİK 170", "TTK 776"], ["kambiyo senedi", "bono", "tanzim tarihi", "zorunlu unsur", "imzaya itiraz"],
      "Tanzim tarihi bulunmayan senedin bono vasfı taşımadığı, kambiyo yoluyla takibin iptali gerektiği belirtildi.",
      "Tanzim tarihi bononun zorunlu unsurlarındandır. Bu unsuru taşımayan senet kambiyo senedi niteliğinde değildir ve kambiyo senetlerine özgü haciz yoluyla takibe konu edilemez. İcra mahkemesince bu husus re'sen gözetilerek takibin iptaline karar verilmelidir."],
    ["ÖRN-31", "yuksek", "Hukuk dairesi (icra)", "2023-01-17", "Onama", "Çek alacağı", ["İİK 168", "İİK 169/a"], ["borca itiraz", "ödeme belgesi", "imzası ikrar edilmiş belge", "çek"],
      "Kambiyo takibinde borca itirazın ancak resmi ya da imzası ikrar edilmiş belgeyle ispatlanabileceği kabul edildi.",
      "Borçlunun ödeme iddiasını dayandırdığı belge alacaklı tarafından imzası ikrar edilmiş değildir ve resmi belge niteliği taşımamaktadır. Kambiyo senetlerine dayalı takiplerde bu nitelikte olmayan belgelerle borca itiraz kabul edilemez."],
    ["ÖRN-32", "bam", "Hukuk dairesi (icra)", "2025-07-01", "Kabul", "Fatura alacağı", ["İİK 62", "Tebligat K. 32"], ["ödeme emrine itiraz", "usulsüz tebliğ", "öğrenme tarihi", "itiraz süresi"],
      "Usulsüz tebliğ edilen ödeme emrine itiraz süresinin borçlunun öğrendiği tarihten başlayacağı kabul edildi.",
      "Ödeme emri, adreste bulunmayan borçlu yerine aynı konutta oturmayan bir kişiye tebliğ edilmiştir. Usulsüz tebligatta muhatap tebliği hangi tarihte öğrenmişse o tarih tebliğ tarihi sayılır. İtiraz süresi bu tarihten başlatıldığında itirazın süresinde olduğu anlaşılmaktadır."],
    ["ÖRN-33", "yuksek", "Hukuk dairesi (icra)", "2022-10-04", "Bozma", "İlamlı icra", ["İİK 33"], ["ilamlı icra", "icranın geri bırakılması", "itfa", "ödeme belgesi"],
      "İlamdan sonra ödeme yapıldığının resmi ya da imzası ikrar edilmiş belgeyle ispatı halinde icranın geri bırakılması gerektiği belirtildi.",
      "Borçlu, ilamın kesinleşmesinden sonra alacaklının hesabına ödeme yaptığını banka dekontuyla ispatlamıştır. Banka kayıtları resmi belge niteliğindedir. İtfa nedeniyle icranın geri bırakılmasına karar verilmesi gerekirken istemin reddi hatalıdır."],
    ["ÖRN-34", "bam", "Hukuk dairesi (ticaret)", "2024-12-10", "Ret", "Ticari alacak", ["TTK 5/A"], ["ticari dava", "arabuluculuk dava şartı", "para alacağı"],
      "Konusu para alacağı olan ticari davada arabulucuya başvurulmadan dava açılması usulden ret nedeni sayıldı.",
      "Konusu bir miktar paranın ödenmesi olan ticari davalarda arabulucuya başvurulmuş olunması dava şartıdır. Davacı arabuluculuk son tutanağını sunmamıştır. Davanın dava şartı yokluğundan usulden reddi gerekir."],
    ["ÖRN-35", "kurul", "Kişisel verileri koruma kurulu", "2023-09-12", "İdari para cezası", "KVKK uyum danışmanlığı", ["KVKK 12"], ["veri güvenliği", "ihlal bildirimi", "72 saat", "teknik tedbir"],
      "Veri ihlalinin öğrenildikten sonra 72 saat içinde Kurula bildirilmemesi ve yeterli teknik tedbir alınmaması nedeniyle idari para cezası uygulandı.",
      "Veri sorumlusu ihlali öğrendiği tarihten itibaren gecikmeksizin ve en geç 72 saat içinde Kurula bildirmelidir. Somut olayda bildirim süre geçtikten sonra yapılmış, erişim yetkilendirmesi ve kayıt tutma gibi teknik tedbirlerin eksik olduğu görülmüştür."],
    ["ÖRN-36", "yuksek", "Hukuk dairesi (kira)", "2024-10-01", "Onama", "Kira sözleşmesi hazırlığı", ["TBK 347"], ["konut kirası", "on yıllık uzama süresi", "bildirimle fesih", "fesih bildirimi"],
      "On yıllık uzama süresinin sonunda kiraya verenin gerekçe göstermeksizin süresinde bildirimle sözleşmeyi sona erdirebileceği kabul edildi.",
      "Konut kiralarında kiraya veren, on yıllık uzama süresi dolduktan sonra her uzama yılının bitiminden en az üç ay önce bildirimde bulunmak koşuluyla, herhangi bir sebep göstermeksizin sözleşmeyi sona erdirebilir. Bildirim süresinde yapıldığından tahliyeye karar verilmesi yerindedir."],
    ["ÖRN-37", "yuksek", "Hukuk dairesi (ticaret)", "2025-02-25", "Kısmen kabul", "Bayilik sözleşmesi incelemesi", ["TTK 122"], ["denkleştirme tazminatı", "bayilik", "tek satıcılık", "kıyasen uygulama"],
      "Acenteye ilişkin denkleştirme tazminatı hükmünün, koşulları varsa tek satıcılık ve bayilik ilişkilerine kıyasen uygulanabileceği kabul edildi.",
      "Bayi, sağladığı müşteri çevresini sözleşme sona erdikten sonra da üreticinin yararlanmasına bırakmıştır. Bayilik ilişkisinin acentelikle benzer özellikler taşıdığı ölçüde denkleştirme tazminatı hükmü kıyasen uygulanır. Tazminatın hakkaniyete uygun miktarı bilirkişi raporuyla belirlenmiştir."]
  ];
  var KARARLAR = K.map(function (x) { return { id: x[0], kaynak: x[1], daire: x[2], tarih: x[3], sonuc: x[4], konu: x[5], kanun: x[6], kavram: x[7], ozet: x[8], gerekce: x[9] }; });

  // Dosya konusu → ilgili kanun maddeleri ve hukuki mesele şablonu (şablon bilerek kişi adı içerir: maskelemeyi göstermek için)
  var KONU = {
    "Alacak": [["TBK 117", "3095 s.K. 2"], "{M} ile {K} arasındaki ticari alacak uyuşmazlığı ({E}). Temerrüt tarihi ve uygulanacak faiz oranı tartışmalı; ihtarname tebliğ edildi."],
    "İşçilik alacağı": [["İK 41", "1475 s.K. 14"], "{M} ile {K} arasındaki işçilik alacağı davası ({E}). Fazla çalışma yalnızca tanık beyanına dayanıyor, bordrolar imzalı. Kıdem tazminatı ve hakkaniyet indirimi tartışmalı."],
    "Kira tespiti": [["TBK 344"], "{M} ile {K} arasındaki kira tespiti davası ({E}). Kira ilişkisi beş yılı aştı; bilirkişi emsal kira bedeline dayandı, hakkaniyet indirimi yapılmadı."],
    "Tazminat (trafik kazası)": [["KTK 85", "TBK 52"], "{M} ile {K} arasındaki trafik kazası tazminat davası ({E}). Karşı taraf yolcunun emniyet kemeri takmadığını ileri sürüp müterafik kusur indirimi istiyor."],
    "Boşanma ve velayet": [["TMK 166", "TMK 182"], "{M} ile {K} arasındaki boşanma ve velayet davası ({E}). Çocuk idrak çağında; sosyal inceleme raporu alındı, çocuğun dinlenmesi talep edilecek."],
    "Ayıplı mal": [["TKHK 8", "TKHK 11"], "{M} ile {K} arasındaki ayıplı mal uyuşmazlığı ({E}). Araçta teslimden sonra ortaya çıkan gizli ayıp; tüketici bedel iadesini seçti."],
    "İmar para cezasının iptali": [["3194 s.K. 42", "İYUK 7"], "{M} adına verilen imar para cezası ({E}). Belediye ({K}) yerinde tespit yapmadan hava fotoğrafına dayandı; dava açma süresi işliyor."],
    "Vergi ziyaı cezasının iptali": [["VUK 344", "VUK 359"], "{M} hakkında sahte fatura kullanımı gerekçesiyle üç kat vergi ziyaı cezası ({E}). Mükellefin faturaların sahte olduğunu bildiği tespit edilmemiş."],
    "İtirazın iptali": [["İİK 67"], "{M} ile {K} arasındaki itirazın iptali davası ({E}). Alacak cari hesaba ve faturalara dayanıyor; icra inkâr tazminatı talep edildi."],
    "Menfi tespit": [["İİK 72"], "{M}, {K} tarafından takibe konulan senet nedeniyle borçlu olmadığının tespitini istiyor ({E}). Senet bedelsiz kaldı; kötüniyet tazminatı talebi var."],
    "Fatura alacağı": [["İİK 67", "TTK 21"], "{M} adına {K} aleyhine fatura alacağı takibi ({E}). Borçlu ödeme emrine itiraz etti; faturalara sekiz gün içinde itiraz edilmemişti."],
    "Çek alacağı": [["İİK 168", "İİK 169/a"], "{M} adına {K} aleyhine çeke dayalı kambiyo takibi ({E}). Borçlu ödeme yaptığını ileri sürerek borca itiraz etti."],
    "Kira alacağı": [["İİK 269", "TBK 315"], "{M} adına kiracı {K} aleyhine birikmiş kira alacağı ve tahliye takibi ({E}). Ödeme emrine rağmen süresinde ödeme yapılmadı."],
    "Kambiyo senedi (bono)": [["İİK 168", "İİK 170"], "{M} adına {K} aleyhine bonoya dayalı kambiyo takibi ({E}). Borçlu imzaya itiraz etti; senette tanzim tarihi tartışmalı."],
    "İlamlı icra": [["İİK 33"], "{M} adına {K} aleyhine ilamlı icra takibi ({E}). Borçlu ilamdan sonra ödeme yaptığını ileri sürüp icranın geri bırakılmasını istiyor."],
    "İşe iade": [["İK 20", "7036 s.K. 3"], "{M} ile {K} arasındaki işe iade uyuşmazlığı ({E}). Fesih performans düşüklüğüne dayanıyor; savunma alınmamış."],
    "Ticari alacak": [["TTK 5/A"], "{M} ile {K} arasındaki ticari para alacağı uyuşmazlığı ({E}). Arabuluculuk dava şartı süreci yürüyor."],
    "Kira uyuşmazlığı": [["TBK 344"], "{M} ile {K} arasındaki kira bedeli uyuşmazlığı ({E}). Beş yıllık süre ve emsal kira bedeli tartışmalı."],
    "Bayilik sözleşmesi incelemesi": [["TTK 122"], "{M} için bayilik sözleşmesi incelemesi. Sözleşme sona ererse denkleştirme tazminatı riski ve tek satıcılık hükümleri."],
    "KVKK uyum danışmanlığı": [["KVKK 12"], "{M} için KVKK uyum çalışması. Veri ihlali bildirimi, 72 saat kuralı ve teknik tedbirler."],
    "Kira sözleşmesi hazırlığı": [["TBK 347"], "{M} için konut kira sözleşmesi hazırlığı. On yıllık uzama süresi ve bildirimle fesih koşulları."],
    "İşyeri yönetmeliği": [["İK 41"], "{M} için işyeri yönetmeliği. Fazla çalışma onayı, kayıt ve bordro uygulaması."],
    "Şirket ana sözleşme değişikliği": [[], "{M} için ana sözleşme değişikliği danışmanlığı."]
  };

  /* ---------- 2. Arama motoru (tarayıcıda; canlıda arama servisinde) ---------- */
  var STOP = "ve veya ile ise ki de da bu şu o bir için gibi olan olarak olduğu olduğunu ancak daha en çok her hem ne nin nın nun nün ın in un ün mı mi mu mü dır dir tır tir sonra önce kadar göre üzerine yönelik ilişkin arasındaki aleyhine adına tarafından hakkında dava davası davada uyuşmazlığı uyuşmazlık esas dosya tarihi tartışmalı edildi var yok istiyor ileri sürüp sürerek talep talebi".split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  function norm(s) { return String(s || "").toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
  function kok(w) { return w.length > 6 ? w.slice(0, 6) : w; } // kaba Türkçe gövdeleme: ek yükünü kırpar
  function tokens(s) { return norm(s).split(" ").filter(function (w) { return w.length > 2 && !STOPSET[w] && !/^\d+$/.test(w); }).map(kok); }
  function kanunKey(s) { return norm(s).replace(/\bm\b|\s+/g, ""); }

  var DOCS = KARARLAR.map(function (k) {
    var t = [].concat(tokens(k.konu), tokens(k.konu), tokens(k.kavram.join(" ")), tokens(k.kavram.join(" ")), tokens(k.kavram.join(" ")), tokens(k.ozet), tokens(k.gerekce));
    var tf = {}; t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    return { k: k, tf: tf, len: t.length, kanun: k.kanun.map(kanunKey) };
  });
  var N = DOCS.length, AVG = DOCS.reduce(function (a, d) { return a + d.len; }, 0) / N, DF = {};
  DOCS.forEach(function (d) { Object.keys(d.tf).forEach(function (w) { DF[w] = (DF[w] || 0) + 1; }); });
  function idf(w) { var n = DF[w] || 0; return Math.log(1 + (N - n + 0.5) / (n + 0.5)); }

  // Metinde geçen kanun atıflarını yakala: "TBK 344", "İİK m.67", "4857 s.K. 41" vb.
  function kanunCikar(s) {
    var out = [], re = /(TBK|TMK|HMK|İİK|IIK|TTK|KTK|VUK|İYUK|TKHK|KVKK|İK)\s*(?:m\.?\s*)?(\d+(?:\/[a-zA-Z])?)/g, m;
    while ((m = re.exec(s))) out.push(m[1].replace("IIK", "İİK") + " " + m[2]);
    return out;
  }

  function ara(q) {
    var temiz = String(q.metin || "").replace(/\[[^\]]*\]/g, " ");
    var qt = tokens(temiz), qs = {}; qt.forEach(function (w) { qs[w] = 1; });
    var qk = (q.kanun || []).concat(kanunCikar(q.metin || "")).map(kanunKey);
    var qkSet = {}; qk.forEach(function (x) { qkSet[x] = 1; });
    var res = DOCS.filter(function (d) {
      if (q.kaynak && d.k.kaynak !== q.kaynak) return false;
      if (q.sonuc && d.k.sonuc.indexOf(q.sonuc) !== 0) return false;
      if (q.yil && +d.k.tarih.slice(0, 4) < q.yil) return false;
      return true;
    }).map(function (d) {
      var s = 0, eslesen = [];
      Object.keys(qs).forEach(function (w) {
        var f = d.tf[w]; if (!f) return;
        s += idf(w) * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.len / AVG)); eslesen.push(w);
      });
      var kEs = d.k.kanun.filter(function (x) { return qkSet[kanunKey(x)]; });
      s += kEs.length * 2.5;
      var konuEs = q.konu && q.konu === d.k.konu; if (konuEs) s += 1.5;
      var kavEs = d.k.kavram.filter(function (kv) { var t = tokens(kv); return t.length && t.every(function (w) { return qs[w]; }); });
      return { k: d.k, skor: s, kanun: kEs, kavram: kavEs, konu: konuEs, kelime: eslesen };
    }).filter(function (r) { return r.skor > 0.8; });
    res.sort(function (a, b) { return b.skor - a.skor; });
    var ust = res.length ? res[0].skor : 0;
    res = res.filter(function (r) { return r.skor >= ust * 0.25 && (r.kanun.length || r.kavram.length || r.konu || r.skor >= 4); }); // en iyi sonuca göre çok zayıf kalanları gösterme
    return { sonuc: res.slice(0, 8), toplam: res.length, terimler: qs };
  }

  /* ---------- 3. Maskeleme: büro dışına çıkan sorgu paketi ---------- */
  function rxEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function kurumMu(ad) { return /A\.Ş\.|Ltd|Şti|Belediye|Müdürlüğü|Kooperatif|Dairesi|Bankası/i.test(ad); }
  function maskele(metin, f) {
    var S = A.state(), say = {}, adlar = [];
    function ekle(ad, etiket) { if (ad && ad !== "—" && ad.length > 2) adlar.push([ad, etiket]); }
    if (f) { ekle(A.client(f.muvekkilId).ad, "MÜVEKKİL"); ekle(f.karsi, "KARŞI TARAF"); }
    S.muvekkiller.forEach(function (c) { ekle(c.ad, "KİŞİ/KURUM"); if (!kurumMu(c.ad)) { var p = c.ad.split(" "); if (p.length > 1) ekle(p[p.length - 1], "KİŞİ/KURUM"); } });
    S.dosyalar.forEach(function (x) { ekle(x.karsi, "KİŞİ/KURUM"); if (!kurumMu(x.karsi)) { var p = x.karsi.split(" "); if (p.length > 1) ekle(p[p.length - 1], "KİŞİ/KURUM"); } });
    S.users.forEach(function (u) { ekle(u.ad.replace(/^(Stj\. )?Av\. /, ""), "AVUKAT/PERSONEL"); });
    adlar.sort(function (a, b) { return b[0].length - a[0].length; });
    var t = String(metin || "");
    function rep(re, etiket) { t = t.replace(re, function () { say[etiket] = (say[etiket] || 0) + 1; return "[" + etiket + "]"; }); }
    var gorulen = {};
    adlar.forEach(function (x) {
      if (gorulen[x[0]]) return; gorulen[x[0]] = 1;
      rep(new RegExp("(?<![\\p{L}\\p{N}])" + rxEsc(x[0]) + "(?![\\p{L}\\p{N}])", "giu"), x[1]);
    });
    rep(/\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, "IBAN");
    rep(/(?<!\d)[1-9]\d{10}(?!\d)/g, "TCKN");
    rep(/(?<!\d)\d{10}(?!\d)/g, "VKN");
    rep(/(?:\+90\s?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, "TELEFON");
    rep(/[\w.+-]+@[\w-]+\.[\w.]+/g, "E-POSTA");
    rep(/\b\d{4}\/\d+\s?[EK]\.?(?=[\s,;)]|$)/g, "ESAS NO");
    rep(/\bB-\d{4}-\d{3}\b/g, "DOSYA NO");
    rep(/(?<![\p{L}\d])(0[1-9]|[1-7]\d|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?\d{2,4}(?!\d)/gu, "PLAKA");
    rep(/\d{1,3}(?:\.\d{3})+(?:,\d+)?\s?(?:TL|₺)|\d+\s?(?:TL|₺)/g, "TUTAR");
    rep(/(?:[\p{Lu}][\p{L}]+\s){1,3}(?:Mah\.|Mahallesi|Cad\.|Caddesi|Sok\.|Sokak|Bulvarı)(?:[\s\p{L}.]*?(?:Sok\.|Sokak|Cad\.|Caddesi))?(?:\s?No:?\s?\d+(?:\/\d+)?)?/gu, "ADRES");
    var toplam = Object.keys(say).reduce(function (a, k) { return a + say[k]; }, 0);
    return { metin: t, sayac: say, toplam: toplam };
  }

  /* ---------- 4. Arayüz ---------- */
  var esc = A.esc;
  var durum = {}; // ekran başına sorgu durumu: anahtar "dosyaId" ya da "_genel"
  function st(key, f) {
    if (!durum[key]) {
      var k = f ? (KONU[f.konu] || [[], "{M} ile {K} arasındaki " + f.konu + " uyuşmazlığı ({E})."]) : [[], ""];
      var metin = f ? k[1].replace("{M}", A.client(f.muvekkilId).ad).replace("{K}", f.karsi && f.karsi !== "—" ? f.karsi : "karşı taraf").replace("{E}", f.esas !== "—" ? "esas " + f.esas : "dosya " + f.no) : "";
      durum[key] = { acik: !!f && window.innerWidth > 760, metin: metin, kanun: k[0].slice(), konu: f ? f.konu : "", kaynak: "", sonuc: "", yil: 0, dosyaId: f ? f.id : "" };
    }
    return durum[key];
  }
  function vurgula(s, terimler) {
    return esc(s).replace(/[\p{L}\p{N}]+/gu, function (w) { return terimler[kok(w.toLocaleLowerCase("tr"))] && w.length > 2 ? "<mark>" + w + "</mark>" : w; });
  }
  function guc(r, ust) { var o = r.skor / ust; return o >= 0.7 ? ["guclu", "Güçlü benzerlik"] : o >= 0.4 ? ["orta", "Orta benzerlik"] : ["zayif", "Zayıf benzerlik"]; }
  function paket(q, mk) {
    var p = { konu: q.konu || null, kanun_maddeleri: q.kanun, hukuki_mesele: mk.metin, filtre: { kaynak: q.kaynak || "tümü", sonuc: q.sonuc || "tümü", yil_en_az: q.yil || null } };
    return JSON.stringify(p, null, 2);
  }

  function panel(key, f) {
    var q = st(key, f), mk = maskele(q.metin, f), r = ara({ metin: mk.metin, kanun: q.kanun, konu: q.konu, kaynak: q.kaynak, sonuc: q.sonuc, yil: q.yil });
    var S = A.state(), bagli = f || (q.dosyaId ? A.dosya(q.dosyaId) : null);
    var ekli = bagli && bagli.emsaller ? bagli.emsaller : [];
    var h = '<div class="emsal" data-ekey="' + key + '">';
    // Sorgu kartı
    h += '<section class="card"><h2 class="e-h">' + (f ? "Bu dosyaya benzer kararlar" : "Hukuki meseleyi yazın") + '</h2>';
    if (!f) {
      var dl = A.benimDosyalarim();
      h += '<label class="field">Bir dosyadan başla (isteğe bağlı)<select data-e="dosya"><option value="">Dosya seçmeden ara</option>' + dl.map(function (x) { return '<option value="' + x.id + '"' + (q.dosyaId === x.id ? " selected" : "") + ">" + esc(A.client(x.muvekkilId).ad + " · " + x.konu) + "</option>"; }).join("") + "</select></label>";
    }
    h += '<label class="field">Hukuki mesele<textarea data-e="metin" rows="3" placeholder="Örn. Fazla çalışma tanık beyanıyla ispatlanmış; hakkaniyet indirimi yapılmalı mı?">' + esc(q.metin) + "</textarea></label>";
    if (!f && !q.metin) h += '<div class="e-ornek">Deneyin: ' + ["Fazla çalışma tanık beyanı hakkaniyet indirimi", "Kira tespiti beş yıl emsal kira", "Bonoda tanzim tarihi eksik imzaya itiraz", "Emniyet kemeri müterafik kusur"].map(function (o) { return '<button type="button" class="btn sm" data-ornek="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div>";
    h += '<div class="e-fil"><span class="faint">Kanun maddeleri:</span> ' + (q.kanun.length ? q.kanun.map(function (x) { return '<span class="tag">' + esc(x) + "</span>"; }).join(" ") : '<span class="faint">metinden otomatik</span>') +
      '<select data-e="kaynak" aria-label="Kaynak"><option value="">Tüm kaynaklar</option>' + Object.keys(KAYNAK).map(function (k) { return '<option value="' + k + '"' + (q.kaynak === k ? " selected" : "") + ">" + KAYNAK[k] + "</option>"; }).join("") + "</select>" +
      '<select data-e="sonuc" aria-label="Sonuç"><option value="">Tüm sonuçlar</option>' + ["Onama", "Bozma", "Kabul", "Kısmen kabul", "Ret"].map(function (k) { return '<option' + (q.sonuc === k ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select>" +
      '<select data-e="yil" aria-label="Tarih"><option value="0">Tüm yıllar</option>' + [2022, 2023, 2024, 2025].map(function (y) { return '<option value="' + y + '"' + (q.yil === y ? " selected" : "") + ">" + y + " ve sonrası</option>"; }).join("") + "</select></div>";
    // Gizlilik: dışarı çıkan paket
    h += '<details class="e-priv"' + (q.acik ? " open" : "") + '><summary><span class="e-lock" aria-hidden="true">●</span> Arama servisine giden sorgu · <b>' + mk.toplam + " kişisel veri maskelendi</b>" + (mk.toplam ? " (" + Object.keys(mk.sayac).map(function (k) { return mk.sayac[k] + " " + k.toLocaleLowerCase("tr"); }).join(", ") + ")" : "") + "</summary>" +
      '<div class="e-pgrid"><div><h3>Giden (yalnızca bu)</h3><pre>' + esc(paket(q, mk)) + "</pre></div>" +
      '<div><h3>Büroda kalan</h3><ul><li>Müvekkil ve karşı taraf kimlikleri</li><li>Esas no, dosya no, TCKN/VKN, IBAN, plaka, adres</li><li>Dilekçeler, belgeler, büro içi notlar</li><li>Ücret, masraf ve tutarlar</li></ul><p class="faint">Canlıda: maskeleme büro sunucusunda çalışır; arama servisi müvekkil veritabanına erişemez ve sorguları kişiyle eşleştirmez.</p></div></div></details>';
    h += "</section>";
    // Dosyaya eklenenler
    if (bagli) {
      h += '<section class="card flush mt14"><div class="sec-h"><h2>Dosyaya eklenen emsaller</h2><span class="faint">' + ekli.length + "</span></div><ul class=\"list\">" +
        (ekli.length ? ekli.map(function (e) { var k = KARARLAR.filter(function (x) { return x.id === e.id; })[0]; return '<li><div class="grow"><b>' + esc(k.id) + " · " + esc(k.konu) + '</b><div class="s">' + esc(KAYNAK[k.kaynak]) + " · " + esc(k.sonuc) + " · ekleyen " + esc(A.user(e.ekleyen).ad) + "</div></div><button type=\"button\" class=\"btn sm\" data-etam=\"" + k.id + "\">Oku</button><button type=\"button\" class=\"btn sm\" data-ecikar=\"" + k.id + "\">Çıkar</button></li>"; }).join("") : '<li class="empty"><span>Henüz emsal eklenmedi. Aşağıdaki sonuçlardan "Dosyaya ekle" ile ekleyin.</span></li>') + "</ul></section>";
    }
    // Sonuçlar
    var ust = r.sonuc.length ? r.sonuc[0].skor : 1;
    h += '<div class="sec-h mt14"><h2>Benzer kararlar</h2><span class="faint">' + (q.metin ? r.toplam + " sonuçtan ilk " + r.sonuc.length : "Arama için mesele yazın") + "</span></div>";
    if (q.metin && !r.sonuc.length) h += '<div class="card"><p class="m0">Eşleşen karar bulunamadı. Filtreleri gevşetin ya da meseleyi farklı kelimelerle yazın.</p></div>';
    h += '<ol class="e-res">' + r.sonuc.map(function (x) {
      var g = guc(x, ust), var_ = ekli.some(function (e) { return e.id === x.k.id; });
      var neden = [].concat(x.kanun.map(function (k) { return "<b>" + esc(k) + "</b>"; }), x.kavram.map(function (k) { return esc(k); }));
      if (x.konu) neden.unshift("aynı dava türü");
      return '<li class="card e-card"><div class="e-top"><div><span class="tag e-sent">Sentetik örnek</span> <span class="mono">' + esc(x.k.id) + "</span> · " + esc(KAYNAK[x.k.kaynak]) + " · " + esc(x.k.daire) + " · " + A.kisaTarih(x.k.tarih) + "</div>" +
        '<span class="chip e-' + g[0] + '">' + g[1] + "</span></div>" +
        '<h3>' + esc(x.k.konu) + ' <span class="e-sonuc s-' + norm(x.k.sonuc).split(" ")[0] + '">' + esc(x.k.sonuc) + "</span></h3>" +
        "<p>" + vurgula(x.k.ozet, r.terimler) + "</p>" +
        (neden.length ? '<p class="e-neden">Neden benzer: ' + neden.join(" · ") + "</p>" : "") +
        '<div class="e-act">' + (bagli ? (var_ ? '<span class="chip u-tamam">Dosyaya eklendi</span>' : '<button type="button" class="btn sm pri" data-eekle="' + x.k.id + '">Dosyaya ekle</button>') : "") + '<button type="button" class="btn sm" data-etam="' + x.k.id + '">Gerekçeyi oku</button></div></li>';
    }).join("") + "</ol>";
    h += '<p class="faint sm14">Bu demodaki ' + KARARLAR.length + " karar sentetiktir ve gerçek mahkeme kararı değildir. Canlıda kararlar kamuya açık resmî kaynaklardan alınır, her sonuç resmî metne bağlantı verir; benzerlik avukatın değerlendirmesinin yerini tutmaz.</p>";
    h += "</div>";
    return h;
  }

  function bind(key, f) {
    var root = document.querySelector('.emsal[data-ekey="' + key + '"]'); if (!root) return;
    var q = st(key, f), tmr;
    function yeniden(odak) {
      var p = root.parentNode, html = panel(key, f), d = document.createElement("div"); d.innerHTML = html;
      p.replaceChild(d.firstChild, root); bind(key, f);
      if (odak) { var el = document.querySelector('.emsal[data-ekey="' + key + '"] [data-e="' + odak + '"]'); if (el) { el.focus(); if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); } }
    }
    function kaydetArama() { var mk = maskele(q.metin, f); A.log("Emsal araması yapıldı (" + mk.toplam + " kişisel veri maskelendi)", f ? f.id : (q.dosyaId || null)); A.save(); }
    var dt = root.querySelector(".e-priv"); dt.ontoggle = function () { q.acik = dt.open; };
    var ta = root.querySelector('[data-e="metin"]');
    ta.oninput = function () { q.metin = ta.value; clearTimeout(tmr); tmr = setTimeout(function () { kaydetArama(); yeniden("metin"); }, 450); };
    ["kaynak", "sonuc", "yil"].forEach(function (k) { var el = root.querySelector('[data-e="' + k + '"]'); el.onchange = function () { q[k] = k === "yil" ? +el.value : el.value; yeniden(k); }; });
    var ds = root.querySelector('[data-e="dosya"]');
    if (ds) ds.onchange = function () { var x = A.dosya(ds.value); var keep = { kaynak: q.kaynak, sonuc: q.sonuc, yil: q.yil }; delete durum[key]; var n = st("_tmp", x); delete durum._tmp; durum[key] = n; Object.assign(n, keep); if (!x) n.dosyaId = ""; yeniden("dosya"); };
    root.querySelectorAll("[data-ornek]").forEach(function (b) { b.onclick = function () { q.metin = b.getAttribute("data-ornek"); kaydetArama(); yeniden("metin"); }; });
    root.querySelectorAll("[data-eekle]").forEach(function (b) {
      b.onclick = function () {
        var hedef = f || A.dosya(q.dosyaId), id = b.getAttribute("data-eekle");
        A.act(function () { if (!hedef.emsaller) hedef.emsaller = []; hedef.emsaller.unshift({ id: id, ekleyen: A.me().id, tarih: A.state().today }); hedef.olaylar.push({ tarih: A.state().today, tur: "evrak", metin: "Emsal karar eklendi: " + id + " (" + A.me().ad + ")." }); A.log("Emsal eklendi: " + id, hedef.id); }, id + " dosyaya eklendi.");
      };
    });
    root.querySelectorAll("[data-ecikar]").forEach(function (b) {
      b.onclick = function () { var hedef = f || A.dosya(q.dosyaId), id = b.getAttribute("data-ecikar"); A.act(function () { hedef.emsaller = hedef.emsaller.filter(function (e) { return e.id !== id; }); A.log("Emsal çıkarıldı: " + id, hedef.id); }, id + " dosyadan çıkarıldı."); };
    });
    root.querySelectorAll("[data-etam]").forEach(function (b) { b.onclick = function () { tamMetin(b.getAttribute("data-etam"), q); }; });
  }

  function tamMetin(id, q) {
    var k = KARARLAR.filter(function (x) { return x.id === id; })[0], terimler = {};
    tokens(maskele(q.metin).metin).forEach(function (w) { terimler[w] = 1; });
    A.modal('<h2>' + esc(k.id) + " · " + esc(k.konu) + '</h2><p class="muted m0">' + esc(KAYNAK[k.kaynak]) + " · " + esc(k.daire) + " · " + A.kisaTarih(k.tarih) + " · <b>" + esc(k.sonuc) + "</b></p>" +
      '<p class="e-neden">Atıf yapılan maddeler: ' + k.kanun.map(esc).join(", ") + "</p><h3>Özet</h3><p>" + vurgula(k.ozet, terimler) + "</p><h3>Gerekçe</h3><p>" + vurgula(k.gerekce, terimler) + "</p>" +
      '<p class="faint sm14">Sentetik örnek karardır. Canlıda burada resmî karar metni ve kaynağına bağlantı yer alır.</p><div class="e-macts"><button type="button" class="btn pri" data-close>Kapat</button></div>', null, { label: k.id + " karar metni" });
  }

  /* ---------- 5. Uygulamaya bağla ---------- */
  function goster() { return A.can("emsal"); } // yetki matrisi: ortak, avukat, stajyer
  A.NAV.splice(4, 0, { id: "emsal", ad: "Emsal arama", ikon: "emsal", show: goster });
  A.GUARD.emsal = "emsal";
  A.VIEWS.emsal = function () {
    var h = '<div class="ph"><div><h1>Emsal arama</h1><p>Benzer konudaki kararları bulur. Müvekkil bilgileri arama servisine gitmez; yalnızca maskelenmiş hukuki mesele gider.</p></div></div>' + panel("_genel", null);
    setTimeout(function () { bind("_genel", null); }, 0);
    return h;
  };
  var ti = A.TABS.map(function (t) { return t.id; }).indexOf("not");
  A.TABS.splice(ti < 0 ? A.TABS.length : ti, 0, { id: "emsal", ad: "Emsal kararlar", show: goster, body: function (f) { return panel(f.id, f); }, bind: function (f) { bind(f.id, f); } });
  A.FILE_ACTIONS.push({ id: "emsal", ad: "Emsal bul", kisa: "Emsal", show: goster, run: function (f) { location.hash = "#/dosya/" + f.id + "/emsal"; } });

  window.BuroEmsal = { KARARLAR: KARARLAR, ara: ara, maskele: maskele, kanunCikar: kanunCikar };
  A.render();
})();
