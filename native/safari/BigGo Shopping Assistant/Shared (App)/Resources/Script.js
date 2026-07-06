function show(platform, enabled) {
    document.body.classList.add(`platform-${platform}`);

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

function setLocalizationTW() {
    document.querySelector(".tip").textContent = "請打開 Safari 偏好設定，並啟用 BigGo 購物幫手！"
    document.querySelector(".title").textContent = "允許訪問權限，讓我們可以為您提供更豐富且個人化的使用體驗。"
    document.querySelector(".desc1").textContent = "為您找到最優惠的商品一直是我們的使命。當您比價搜尋或是進入購物網站時，BigGo 購物幫手會蒐集該網站之數據，以找到相關的優惠碼、回饋獎勵，為您提供更完善的購物體驗。"
    document.querySelector(".desc2").textContent = "請在瀏覽器跳出權限要求時，選擇【一律在每個網站允許】該擴充功能，即可完整使用 BigGo 購物幫手的服務。"
    document.querySelector(".hint").innerHTML = `了解更多關於擴充功能收集的數據和原因，請詳閱<a id="privacy" href="javascript:void(0)">BigGo 隱私權政策</a>。`
    document.querySelector(".btn").textContent = "開啟偏好設定"
    document.querySelector("#main-img").src = "../img-safari-pravicy-tw@2x.png"
}

function setLocalizationEN() {
    document.querySelector(".tip").textContent = "Just one more click! Enable BigGo Shopping Assistant, tick the checkbox in Safari Preferences as shown below."
    document.querySelector(".title").textContent = "Allow access to have more functional and personalized user experience."
    document.querySelector(".desc1").textContent = "It has always been our mission to provide information on the best deal. BigGo Shopping Assistant only collects data when you search or are on the sites with a shopping cart. In this way, we can provide you relevant promo codes, rewards and make shopping experience better for you. "
    document.querySelector(".desc2").textContent = "The extension will not be fully functioned without access to Cookies, please choose to allow all your data on all website you visit before starting each shopping."
    document.querySelector(".hint").innerHTML = `For details about the data we collect and what we do with it are provided in <a id="privacy" href="javascript:void(0)">BigGo Privacy Policy</a>.`
    document.querySelector(".btn").textContent = "Open Preferences"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function setLocalizationTH() {
    document.querySelector(".tip").textContent = "โปรดเปิดการตั้งค่า Safari และเปิดใช้งาน BigGo Shopping Assistant!"
    document.querySelector(".title").textContent = "โปรดอนุญาตการเข้าถึง เพื่อการใช้งานที่ดียิ่งขึ้น"
    document.querySelector(".desc1").textContent = "BigGo Shopping Assistant ตัวช่วยมอบการช้อปปิ้งที่สมบูรณ์แบบ โดยเราจะรวบรวมข้อมูลจากการค้นหาของคุณบนเว็บไซต์ หรือจากสินค้าที่คุณเพิ่มลงตระกร้า เพื่อค้นหาคูปองส่วนลดหรือโปรโมชั่นที่เกี่ยวข้องมาให้คุณ "
    document.querySelector(".desc2").textContent = "โปรดอนุญาตการเข้าถึงคุ้กกี้เพื่อการใช้งานที่สมบูรณ์แบบ"
    document.querySelector(".hint").innerHTML = `หากต้องการข้อมูลเพิ่มเติม โปรดอ่านนโยบายความเป็นส่วนตัวของ <a id="privacy" href="javascript:void(0)">BigGo Privacy Policy</a>.`
    document.querySelector(".btn").textContent = "เปิดการตั้งค่า"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function setLocalizationID() {
    document.querySelector(".tip").textContent = "Hanya satu klik lagi! Aktifkan Asisten Belanja BigGo, centang kotak di Safari Preferensi seperti yang ditunjukkan di bawah ini."
    document.querySelector(".title").textContent = "Izin akses memungkinkan kami mempersonalisasi pengalaman Anda"
    document.querySelector(".desc1").textContent = "Itu selalu menjadi misi kami untuk memberikan informasi tentang kesepakatan terbaik. Asisten Belanja BigGo hanya mengumpulkan data saat Anda menelusuri atau berada di situs dengan keranjang belanja. Dengan cara ini, kami dapat memberi Anda kode promo yang relevan, hadiah, dan menjadikan pengalaman berbelanja lebih baik untuk Anda."
    document.querySelector(".desc2").textContent = "Ekstensi tidak akan berfungsi sepenuhnya tanpa akses ke Cookie, silakan pilih untuk mengizinkan semua data Anda di semua situs web yang Anda kunjungi sebelum memulai setiap belanja."
    document.querySelector(".hint").innerHTML = `Untuk mempelajari lebih lanjut tentang data yang dikumpulkan ekstensi dan alasannya, silakan baca <a id="privacy" href="javascript:void(0)">Kebijakan Privasi BigGo</a>.`
    document.querySelector(".btn").textContent = "Pilih Preferensi"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function setLocalizationMY() {
    document.querySelector(".tip").textContent = "Hanya satu klik lagi! Dayakan Pembantu Beli Belah BigGo, tandakan kotak semak dalam Keutamaan Safari seperti yang ditunjukkan di bawah."
    document.querySelector(".title").textContent = "Kebenaran akses membolehkan kami memperibadikan pengalaman anda"
    document.querySelector(".desc1").textContent = "Ia sentiasa menjadi misi kami untuk memberikan maklumat mengenai tawaran terbaik. Pembantu Beli Belah BigGo hanya mengumpul data apabila anda mencari atau berada di tapak dengan troli beli-belah. Dengan cara ini, kami boleh memberikan anda kod promosi yang berkaitan, ganjaran dan menjadikan pengalaman membeli-belah lebih baik untuk anda."
    document.querySelector(".desc2").textContent = "Sambungan tidak akan berfungsi sepenuhnya tanpa akses kepada Kuki, sila pilih untuk membenarkan semua data anda pada semua tapak web yang anda lawati sebelum memulakan setiap membeli-belah."
    document.querySelector(".hint").innerHTML = `Untuk mengetahui lebih lanjut tentang data yang dikumpul oleh sambungan dan sebabnya, sila baca <a id="privacy" href="javascript:void(0)">Dasar Privasi BigGo</a>.`
    document.querySelector(".btn").textContent = "Pilih Keutamaan"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function setLocalizationVN() {
    document.querySelector(".tip").textContent = "Chỉ cần thêm một cú nhấp chuột nữa! Bật Công cụ hỗ trợ mua sắm BigGo, đánh dấu vào hộp kiểm trong Tùy chọn Safari như hình dưới đây."
    document.querySelector(".title").textContent = "Quyền truy cập cho phép chúng tôi cá nhân hóa trải nghiệm của bạn"
    document.querySelector(".desc1").textContent = "Nhiệm vụ của chúng tôi luôn là cung cấp thông tin về thỏa thuận tốt nhất. Công cụ hỗ trợ mua sắm BigGo chỉ thu thập dữ liệu khi bạn tìm kiếm hoặc trên các trang web có giỏ hàng. Bằng cách này, chúng tôi có thể cung cấp cho bạn mã khuyến mãi, phần thưởng có liên quan và giúp bạn trải nghiệm mua sắm tốt hơn."
    document.querySelector(".desc2").textContent = "Tiện ích mở rộng sẽ không hoạt động đầy đủ nếu không có quyền truy cập vào Cookie, vui lòng chọn cho phép tất cả dữ liệu của bạn trên tất cả các trang web bạn truy cập trước khi bắt đầu mỗi lần mua sắm."
    document.querySelector(".hint").innerHTML = `Để tìm hiểu thêm về dữ liệu mà tiện ích mở rộng thu thập và lý do, vui lòng đọc <a id="privacy" href="javascript:void(0)">Chính sách quyền riêng tư của BigGo</a>.`
    document.querySelector(".btn").textContent = "Hãy chọn Tùy chọn"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function setLocalizationJP() {
    document.querySelector(".tip").textContent = "Just one more click! Enable BigGo Shopping Assistant, tick the checkbox in Safari Preferences as shown below."
    document.querySelector(".title").textContent = "Allow access to have more functional and personalized user experience."
    document.querySelector(".desc1").textContent = "It has always been our mission to provide information on the best deal. BigGo Shopping Assistant only collects data when you search or are on the sites with a shopping cart. In this way, we can provide you relevant promo codes, rewards and make shopping experience better for you. "
    document.querySelector(".desc2").textContent = "The extension will not be fully functioned without access to Cookies, please choose to allow all your data on all website you visit before starting each shopping."
    document.querySelector(".hint").innerHTML = `For details about the data we collect and what we do with it are provided in <a id="privacy" href="javascript:void(0)">BigGo Privacy Policy</a>.`
    document.querySelector(".btn").textContent = "環境設定を選択します"
    document.querySelector("#main-img").src = "../img-safari-pravicy-en@2x.png"
}

function openPrivacyPage(url) {
    return () => webkit.messageHandlers.controller.postMessage(url);
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

function closeWindow() {
    webkit.messageHandlers.controller.postMessage("close");
}

document.querySelector(".open-preferences").addEventListener("click", openPreferences);
document.querySelector(".close").addEventListener("click", closeWindow);

const lang = navigator.language || navigator.userLanguage

let privacyUrl = "https://biggo.sg/offical/disclaimers.php?tag=privacy"
if(lang.startsWith("zh")) {
    setLocalizationTW()
    privacyUrl = "https://biggo.com.tw/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("th")) {
    setLocalizationTH()
    privacyUrl = "https://biggo.co.th/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("id")) {
    setLocalizationID()
    privacyUrl = "https://biggo.id/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("my")) {
    setLocalizationMY()
    privacyUrl = "https://biggo.my/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("vn")) {
    setLocalizationVN()
    privacyUrl = "https://biggo.biz.vn/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("ja")) {
    setLocalizationJP()
    privacyUrl = "https://biggo.jp/offical/disclaimers.php?tag=privacy"
}else if(lang.startsWith("us")) {
    setLocalizationEN()
    privacyUrl = "https://biggo.com/offical/disclaimers.php?tag=privacy"
}else {
    setLocalizationEN()
}

setTimeout(() => {
    document.querySelector("#privacy").addEventListener("click", openPrivacyPage(privacyUrl));
}, 100)