# AreaGPT - Çalıştırma Kılavuzu (Windows 11)

Bu uygulama bir web uygulamasıdır ve yerel bilgisayarınızda çalıştırmak için **Node.js** yüklü olmalıdır.

## Adım Adım Kurulum ve Çalıştırma

1.  **Node.js Yükleyin:**
    *   Eğer bilgisayarınızda yüklü değilse, [nodejs.org](https://nodejs.org/) adresinden "LTS" (Önerilen) sürümünü indirin ve kurun.

2.  **Dosyaları Çıkartın:**
    *   İndirdiğiniz ZIP dosyasını bir klasöre çıkartın.

3.  **Uygulamayı Başlatın:**
    *   Klasörün içindeki `run.bat` dosyasına çift tıklayın.
    *   Bu dosya gerekli paketleri otomatik olarak yükleyecek ve uygulamayı başlatacaktır.

4.  **Tarayıcıda Açın:**
    *   Uygulama başladığında terminalde `http://localhost:3000` gibi bir adres göreceksiniz.
    *   Tarayıcınızı açıp bu adrese giderek uygulamayı kullanmaya başlayabilirsiniz.

## Neden EXE Değil?
Bu bir web uygulamasıdır (Vite + React). EXE dosyaları genellikle derlenmiş masaüstü uygulamaları içindir. Bu projeyi bir EXE haline getirmek isterseniz **Electron** gibi araçlar kullanabilirsiniz, ancak en güvenli ve virüssüz yol Node.js üzerinden çalıştırmaktır.

---

# AreaGPT - Run Guide (English)

This is a web application. To run it locally, you need **Node.js** installed.

1.  Install Node.js from [nodejs.org](https://nodejs.org/).
2.  Extract the ZIP file.
3.  Double-click `run.bat` to install dependencies and start the app.
4.  Open `http://localhost:3000` in your browser.
