# Mission 180 — P1

NASA Space Apps 2026 için uzay görevi sağlık takip simülasyonunun altyapısı.

## Çalıştırma

Node.js **22.18 veya üstü** gerekir. PowerShell'de npm.ps1 engelleniyorsa npm.cmd kullanın.

```powershell
cd "$env:USERPROFILE\Desktop\NASA SPACES PROE"
npm.cmd install
npm.cmd run dev
```

http://localhost:3000 adresini açın. **Gezinmeye başla** düğmesi fareyi yakalar. WASD hareket, fare bakış, Esc imleci bırakma, Tab tableti açma/kapatmadır. Tableti kapattıktan sonra tekrar **Gezinmeye başla** düğmesine tıklayın. Debug panelindeki düğmeler yedi sahneye geçer. Son sahnede sonraki sahne düğmesi kapanır.

```powershell
npm.cmd run build
npm.cmd start
npm.cmd run typecheck
npm.cmd test
npm.cmd run check-models
npm.cmd run fetch-assets
```

## Dosyalar

- app/: App Router sayfası, layout, Tailwind ve sci-fi arayüz stilleri.
- components/MissionExperience.tsx: Canvas, aktif sahne, HUD ve hata sınırı.
- components/FirstPersonPlayer.tsx: PointerLockControls, 1.7 m kamera, WASD ve x/z sınır kutusu.
- components/Hands.tsx: hareketle sallanan iki el yer tutucusu.
- components/ModelLoader.tsx: useGLTF, yerel Draco çözücü, Suspense, kırmızı hata yer tutucusu.
- components/scenes/: yedi ayrı sahne; ortak oda, konsol, tarama kabini ve pencere/dekor uzay görünümü.
- components/ui/: Tab ile açılan Veri yok tableti ve sahne debug paneli.
- store/gameStore.ts: sahne akışı, tablet, görev süresi, görev kimlikleri ve boş tarama alanları.
- data/assets.ts: tek model manifesti ve resmi NASA kaynak bağlantıları.
- scripts/fetch-assets.mjs: NASA sayfalarındaki gerçek a/href dosya bağlantılarını indirir, GLB kopyalar ve rapor üretir.
- scripts/asset-utils.mjs ve fetch-assets.test.mjs: URL ayrıştırma, güvenli dosya adı ve uçtan uca indirme/raporlama testleri.
- public/models/: sekiz hazır GLB ve asset-report.json.
- public/models/raw/: özgün adlarıyla model kopyaları; Git tarafından yok sayılır.
- public/draco/: sıkıştırılmış GLB dosyaları için yerel Draco JavaScript/WASM çözücüsü.
- public/textures/: ileride eklenecek dokuların klasörü.

## Model yükleme

NASA modelleri farklı birimler ve merkezlerle geldiği için yükleyici önce manifestteki rotation değerini uygular, ardından modelin en uzun kenarını **scale metre** olacak şekilde normalize eder ve tabanını position yüksekliğine yerleştirir. İskeletli modeller SkeletonUtils ile kopyalanır. Dünya ve yıldızlar bu aşamada geometrik yer tutucudur.

Kullanıcının Desktop/3D modeler klasöründeki açık dosya adlarıyla eşleşen modeller doğrulanıp public/models/<id>.glb konumuna kopyalandı. Space Shuttle (D) (1).glb ikinci bir mekik kopyası olduğundan kullanılmadı. Kaynak dosyalar masaüstündeki klasörde durur.

| id | format | MB* | GLB |
| --- | --- | ---: | --- |
| shuttle | glb | 2.36 | Evet |
| vab | glb | 6.20 | Evet |
| starMap | — | 0 | Hayır |
| astronaut | glb | 0.73 | Evet |
| missionControlRoom | glb | 0.18 | Evet |
| landsat8 | glb | 0.74 | Evet |
| markIIISuit | glb | 0.85 | Evet |
| issInternal | — | 0 | Hayır |
| jason1 | glb | 0.57 | Evet |
| headquarters | glb | 0.20 | Evet |

*Raporun MB alanı bytes / 1048576 (MiB) olarak hesaplanır.

NASA indirme betiği yalnızca assets.science.nasa.gov üzerindeki belirtilen uzantıları indirir; URL tahmin etmez, ZIP açmaz, format dönüştürmez. Parantezleri ve %28/%29 kodlamasını işler, emrc parametresini kaldırır. Dosya hatasında devam eder. Geçerli yerel GLB'ler NASA erişilemese de raporda korunur; NASA ağ hataları ayrıca yazılır. İndirme zaman aşımı ASSET_PAGE_TIMEOUT_MS ve ASSET_DOWNLOAD_TIMEOUT_MS ile ayarlanabilir.

## Doğrulama durumu

- İndirme betiği için **4 test geçti**. Başarılı GLB/PNG indirme, gerçek dosya adını koruma, GLB kopyalama, hata sonrası devam, yerel GLB koruma, parantez ve emrc ayrıştırması test edildi. Uçtan uca testin ağı yerel taklit yanıtlardır.
- **8/10 yerel GLB doğrulandı**: GLB 2.0 başlığı, bildirilen boyut ve gömülü bağımlılıklar kontrol edildi.
- **18 TypeScript/TSX dosyasında sözdizimi hatası yok**. Bu kontrol tam tip kontrolü veya Next build yerine geçmez.
- npm run fetch-assets **çalıştı ve rapor üretti**. Bu oturumdaki gerçek NASA istekleri EACCES ile engellendi; sekiz yerel model raporda mevcut.
- npm install, npm sunucusuna EACCES nedeniyle tamamlanamadı; çevrimdışı kurulumda @tailwindcss/postcss önbellekte bulunamadı. Bu yüzden **Next build, tam tip kontrolü ve tarayıcı kabul testi doğrulanamadı**. package-lock.json kurulum tamamlanınca üretilir.

## Kalan kapsam

Eksik varlıklar: Yale Bright Star Map ve ISS Internal. Uygulamada yıldız alanı ve oda geometrisi yer tutucu olarak hazırdır. Model yoksa kırmızı kutu kullanılır.

P1 gereği sağlık verisi, tarama davranışı/animasyonu, rapor ekranı, görev oynanışı ve sinematikler eklenmedi. Tarama kabinleri yalnızca geometridir. Çarpışma, sahnenin dış sınır kutusuyla sınırlıdır; iç dekorlar katı engel değildir.

GitHub'a yükleme yapılmadı. raw, node_modules ve .next Git dışında; hazır GLB'ler public/models altında repoya eklenebilir. NASA kaynak bağlantıları manifesttedir; üçüncü taraf çözücü bilgisi public/draco/README.md içindedir.
