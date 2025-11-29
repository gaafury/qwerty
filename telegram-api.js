// Telegram Web App API интеграция
class TelegramAPI {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.init();
    }

    init() {
        // Инициализация Telegram Web App
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        this.tg.BackButton.hide();

        console.log('Telegram Web App инициализирован');
        console.log('Пользователь:', this.getUser());
        console.log('Платформа:', this.getPlatform());
    }

    // Получение данных пользователя
    getUser() {
        return this.tg.initDataUnsafe.user;
    }

    // Получение платформы
    getPlatform() {
        return this.tg.platform;
    }

    // Получение данных из initData
    getInitData() {
        return this.tg.initData;
    }

    // Получение initDataUnsafe
    getInitDataUnsafe() {
        return this.tg.initDataUnsafe;
    }

    // Отправка данных в бота
    sendData(data) {
        try {
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }
            this.tg.sendData(data);
            console.log('Данные отправлены в бота:', data);
            return true;
        } catch (error) {
            console.error('Ошибка отправки данных:', error);
            return false;
        }
    }

    // Показать кнопку "Назад"
    showBackButton(callback) {
        this.tg.BackButton.show();
        this.tg.BackButton.onClick(callback);
    }

    // Скрыть кнопку "Назад"
    hideBackButton() {
        this.tg.BackButton.hide();
    }

    // Установить цвет заголовка
    setHeaderColor(color) {
        this.tg.setHeaderColor(color);
    }

    // Установить цвет фона
    setBackgroundColor(color) {
        this.tg.setBackgroundColor(color);
    }

    // Открыть ссылку
    openLink(url) {
        this.tg.openLink(url);
    }

    // Открыть Telegram ссылку
    openTelegramLink(url) {
        this.tg.openTelegramLink(url);
    }

    // Показать всплывающее окно
    showPopup(params, callback) {
        this.tg.showPopup(params, callback);
    }

    // Показать подтверждение
    showConfirm(message, callback) {
        this.tg.showConfirm(message, callback);
    }

    // Показать alert
    showAlert(message) {
        this.tg.showAlert(message);
    }

    // Закрыть приложение
    close() {
        this.tg.close();
    }

    // Проверить, является ли приложение расширенным
    isExpanded() {
        return this.tg.isExpanded;
    }

    // Версия Telegram
    getVersion() {
        return this.tg.version;
    }

    // Цветовая схема
    getColorScheme() {
        return this.tg.colorScheme;
    }

    // Получить тему
    getThemeParams() {
        return this.tg.themeParams;
    }

    // Отправить запрос в бота
    sendWebAppData(type, data = {}, webAppQueryId = null) {
        const payload = {
            type: type,
            ...data,
            timestamp: Date.now(),
            user_id: this.getUser()?.id
        };

        if (webAppQueryId) {
            payload.web_app_query_id = webAppQueryId;
        }

        return this.sendData(payload);
    }

    // Запрос данных пользователя из бота
    requestUserData() {
        return new Promise((resolve, reject) => {
            const webAppQueryId = 'user_data_' + Date.now();

            const payload = {
                type: 'get_user_data',
                web_app_query_id: webAppQueryId
            };

            // Слушаем ответ от бота
            const handleMessage = (event) => {
                if (event.data && typeof event.data === 'string') {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.user_id === this.getUser()?.id) {
                            window.removeEventListener('message', handleMessage);
                            resolve(data);
                        }
                    } catch (error) {
                        // Игнорируем не JSON сообщения
                    }
                }
            };

            window.addEventListener('message', handleMessage);

            // Таймаут на случай если бот не ответит
            setTimeout(() => {
                window.removeEventListener('message', handleMessage);
                reject(new Error('Timeout waiting for user data'));
            }, 10000);

            this.sendData(payload);
        });
    }

    // Отправка данных оплаты
    sendPaymentData(paymentData) {
        return this.sendWebAppData('payment', paymentData);
    }

    // Проверка статуса платежа
    checkPaymentStatus(invoiceId) {
        return this.sendWebAppData('check_payment', { invoice_id: invoiceId });
    }
}

// Создаем глобальный экземпляр
window.TelegramAPI = new TelegramAPI();
