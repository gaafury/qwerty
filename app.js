// Основное приложение Telegram Premium Shop
class TelegramPremiumApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.prices = null;
        this.currentSubscription = null;
        this.currentCryptoInvoice = null;
        this.referralLink = '';
        this.init();
    }

    async init() {
        try {
            // Показываем загрузочный экран
            this.showLoading();

            // Инициализация Telegram Web App
            this.tg.expand();
            this.tg.enableClosingConfirmation();

            // Загружаем данные пользователя
            await this.loadUserData();

            // Загружаем цены
            await this.loadPrices();

            // Обновляем интерфейс
            this.updateUI();
            this.hideLoading();

            // Авто-обновление цен каждые 30 секунд
            setInterval(() => {
                this.refreshPrices();
            }, 30000);

            console.log('Приложение инициализировано');

        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.hideLoading();
            this.showError('Ошибка загрузки. Попробуйте перезайти.');
        }
    }

    // Загрузка данных пользователя
    async loadUserData() {
        try {
            // Получаем базовые данные из Telegram
            const tgUser = this.tg.initDataUnsafe.user;

            // Запрашиваем дополнительные данные из бота
            this.userData = {
                id: tgUser?.id,
                username: tgUser?.username,
                first_name: tgUser?.first_name,
                last_name: tgUser?.last_name,
                bonus_balance: 0,
                referral_code: '',
                referrals_count: 0
            };

            // Обновляем интерфейс с базовыми данными
            this.updateUserInterface();

        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            // Используем данные по умолчанию
            this.userData = {
                bonus_balance: 0,
                referral_code: 'TG' + Date.now(),
                referrals_count: 0
            };
        }
    }

    // Загрузка цен
    async loadPrices() {
        try {
            // Пытаемся получить цены из бота
            const userData = await TelegramAPI.requestUserData();
            if (userData && userData.prices) {
                this.prices = userData.prices;
                console.log('Цены загружены из бота:', this.prices);
            } else {
                // Используем временные цены
                this.prices = {
                    three_months: 390,
                    six_months: 690,
                    twelve_months: 990
                };
                console.log('Используются цены по умолчанию');
            }
            
            this.renderSubscriptionCards();

        } catch (error) {
            console.error('Ошибка загрузки цен:', error);
            // Цены по умолчанию
            this.prices = {
                three_months: 390,
                six_months: 690,
                twelve_months: 990
            };
            this.renderSubscriptionCards();
        }
    }

    // Обновление цен
    async refreshPrices() {
        try {
            await this.loadPrices();
            console.log('Цены обновлены');
        } catch (error) {
            console.error('Ошибка обновления цен:', error);
        }
    }

    // Рендер карточек подписок с расчетом экономии
    renderSubscriptionCards() {
        const container = document.getElementById('subscriptionCards');
        if (!container) return;

        // ОФИЦИАЛЬНЫЕ ЦЕНЫ TELEGRAM
        const officialPrices = {
            '3months': 1290,
            '6months': 1790,
            '12months': 2990
        };

        const subscriptions = [
            {
                period: '3months',
                name: '3 месяца',
                price: this.prices.three_months,
                officialPrice: officialPrices['3months'],
                popular: false
            },
            {
                period: '6months',
                name: '6 месяцев',
                price: this.prices.six_months,
                officialPrice: officialPrices['6months'],
                popular: false
            },
            {
                period: '12months',
                name: '12 месяцев',
                price: this.prices.twelve_months,
                officialPrice: officialPrices['12months'],
                popular: true
            }
        ];

        // Рассчитываем экономию для каждой подписки
        subscriptions.forEach(sub => {
            const savingsPercent = Math.round(((sub.officialPrice - sub.price) / sub.officialPrice) * 100);
            sub.savingsPercent = savingsPercent;
            sub.savingsText = savingsPercent > 0 ? `Экономия ${savingsPercent}%` : null;
        });

        container.innerHTML = subscriptions.map(sub => `
            <div class="subscription-card ${sub.popular ? 'popular' : ''}" 
                 onclick="app.selectSubscription('${sub.period}', '${sub.name}', ${sub.price})">
                ${sub.popular ? '<div class="popular-badge">🔥 ПОПУЛЯРНО</div>' : ''}
                <h3>${sub.name}</h3>
                <div class="subscription-price">${this.formatNumber(sub.price)} ₽</div>
                <div class="official-price">
                    <s>${this.formatNumber(sub.officialPrice)} ₽</s>
                </div>
                ${sub.savingsText ? `<div class="subscription-savings">${sub.savingsText}</div>` : ''}
                <button class="buy-btn">ВЫБРАТЬ</button>
            </div>
        `).join('');
    }

    // Форматирование числа с пробелами
    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Выбор подписки
    selectSubscription(period, name, price) {
        this.currentSubscription = {
            period: period,
            name: name,
            price: price
        };

        this.showPaymentMethods();
    }

    // Показать методы оплаты
    showPaymentMethods() {
        if (!this.currentSubscription) return;

        // Обновляем информацию о выбранной подписке
        document.getElementById('selectedSubscriptionName').textContent = this.currentSubscription.name;
        document.getElementById('selectedSubscriptionPrice').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';

        this.showPage('paymentMethodsPage');
    }

    // Выбор способа оплаты
    selectPaymentMethod(method) {
        if (!this.currentSubscription) return;

        switch (method) {
            case 'yoomoney':
                this.showYoomoneyPayment();
                break;
            case 'sbp':
                this.showSbpPayment();
                break;
            case 'cryptobot':
                this.showCryptobotPayment();
                break;
            case 'cloudtips':
                this.showCloudtipsPayment();
                break;
        }
    }

    // Показать оплату ЮMoney
    showYoomoneyPayment() {
        if (!this.currentSubscription) return;

        // Генерируем ID заказа
        const orderId = 1000 + Math.floor(Math.random() * 9000);

        // Обновляем информацию на странице
        document.getElementById('yoomoneyOrderId').textContent = orderId;
        document.getElementById('yoomoneyPrice').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';
        document.getElementById('yoomoneyAmount').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';

        // Реквизиты будут загружаться из бота
        document.getElementById('yoomoneyRequisites').textContent = '4100 1173 9163 4901';

        this.showPage('paymentYoomoneyPage');
    }

    // Показать оплату СБП
    showSbpPayment() {
        if (!this.currentSubscription) return;

        // Генерируем ID заказа
        const orderId = 1000 + Math.floor(Math.random() * 9000);

        // Обновляем информацию на странице
        document.getElementById('sbpOrderId').textContent = orderId;
        document.getElementById('sbpPrice').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';
        document.getElementById('sbpAmount').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';

        // Реквизиты будут загружаться из бота
        document.getElementById('sbpPhone').textContent = '+79998887766';
        document.getElementById('sbpReceiver').textContent = 'Алла Ф.';

        this.showPage('paymentSbpPage');
    }

    // Показать оплату CryptoBot
    async showCryptobotPayment() {
        if (!this.currentSubscription) return;

        try {
            this.showLoading();

            // Генерируем ID заказа
            const orderId = 1000 + Math.floor(Math.random() * 9000);

            // Рассчитываем сумму в USDT (примерный курс)
            const usdtRate = 85; // Примерный курс USDT/RUB
            const usdtAmount = (this.currentSubscription.price / usdtRate).toFixed(2);

            // Обновляем информацию на странице
            document.getElementById('cryptoOrderId').textContent = orderId;
            document.getElementById('cryptoPriceRub').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';
            document.getElementById('cryptoPriceUsdt').textContent = '≈ ' + usdtAmount + ' USDT';

            // Здесь будет создание инвойса через бота
            // Временно используем заглушку
            this.currentCryptoInvoice = {
                invoice_url: 'https://t.me/CryptoBot?start=invoice_' + Date.now(),
                invoice_id: 'invoice_' + Date.now()
            };

            this.hideLoading();
            this.showPage('paymentCryptobotPage');

        } catch (error) {
            this.hideLoading();
            this.showError('Ошибка создания счета. Попробуйте другой способ оплаты.');
        }
    }

    // Показать оплату CloudTips
    showCloudtipsPayment() {
        if (!this.currentSubscription) return;

        // Генерируем ID заказа
        const orderId = 1000 + Math.floor(Math.random() * 9000);

        // Обновляем информацию на странице
        document.getElementById('cloudtipsOrderId').textContent = orderId;
        document.getElementById('cloudtipsPrice').textContent = this.formatNumber(this.currentSubscription.price) + ' ₽';

        this.showPage('paymentCloudtipsPage');
    }

    // Показать страницу
    showPage(pageId) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Показываем выбранную страницу
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Обновляем активную кнопку в навигации
        this.updateNavButtons(pageId);

        // Прокручиваем наверх
        window.scrollTo(0, 0);
    }

    // Обновление кнопок навигации
    updateNavButtons(activePage) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Сопоставляем страницы с кнопками навигации
        const pageToNavMap = {
            'subscriptionPage': 0,
            'referralPage': 1
        };

        const navIndex = pageToNavMap[activePage];
        if (navIndex !== undefined && navItems[navIndex]) {
            navItems[navIndex].classList.add('active');
        }
    }

    // Обновление интерфейса пользователя
    updateUI() {
        this.updateUserInterface();
        this.updateReferralInfo();
    }

    // Обновление данных пользователя в интерфейсе
    updateUserInterface() {
        // Баланс
        const balanceElement = document.getElementById('balanceAmount');
        if (balanceElement && this.userData) {
            balanceElement.textContent = this.formatNumber(this.userData.bonus_balance || 0);
        }
    }

    // Обновление реферальной информации
    updateReferralInfo() {
        if (!this.userData) return;

        // Статистика
        const referralsCountElement = document.getElementById('referralsCount');
        const bonusBalanceElement = document.getElementById('bonusBalance');

        if (referralsCountElement) {
            referralsCountElement.textContent = this.formatNumber(this.userData.referrals_count || 0);
        }

        if (bonusBalanceElement) {
            bonusBalanceElement.textContent = this.formatNumber(this.userData.bonus_balance || 0);
        }

        // Реферальная ссылка
        const referralLinkElement = document.getElementById('referralLink');
        if (referralLinkElement) {
            this.referralLink = `https://t.me/${this.tg.initDataUnsafe.user?.username || 'your_bot'}?start=${this.userData.referral_code || 'REF' + Date.now()}`;
            referralLinkElement.textContent = this.referralLink;
        }
    }

    // Копирование реферальной ссылки
    copyReferralLink() {
        if (!this.referralLink) return;

        navigator.clipboard.writeText(this.referralLink).then(() => {
            this.showNotification('Ссылка скопирована!', 'success');
        }).catch(() => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = this.referralLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Ссылка скопирована!', 'success');
        });
    }

    // Поделиться реферальной ссылкой
    shareReferralLink() {
        if (!this.referralLink) return;

        const shareText = 'Присоединяйся к Telegram Premium по выгодной цене! Получи свою подписку со скидкой!';
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.referralLink)}&text=${encodeURIComponent(shareText)}`;

        TelegramAPI.openTelegramLink(shareUrl);
    }

    // Открытие поддержки
    openSupport() {
        TelegramAPI.openTelegramLink('https://t.me/your_support_channel');
    }

    // Показать загрузочный экран
    showLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    // Скрыть загрузочный экран
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Возможность закрыть кликом
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.remove();
            }
        });
    }

    // Показать ошибку
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Показать успех
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Обновить цены
    async refreshPrices() {
        try {
            this.showNotification('Обновляем цены...', 'info');
            await this.loadPrices();
            this.showNotification('Цены обновлены!', 'success');
        } catch (error) {
            console.error('Ошибка обновления цен:', error);
            this.showError('Ошибка обновления цен');
        }
    }

    // Отправка оплаты ЮMoney
    async submitYoomoneyPayment() {
        if (!window.PaymentsManager.currentFile) {
            this.showNotification('Пожалуйста, загрузите скриншот оплаты', 'error');
            return;
        }

        const subscription = this.currentSubscription;
        if (!subscription) {
            this.showNotification('Ошибка: не выбрана подписка', 'error');
            return;
        }

        try {
            // Конвертируем файл в base64
            const base64File = await window.PaymentsManager.fileToBase64(window.PaymentsManager.currentFile);

            const paymentData = {
                type: 'payment_screenshot',
                payment_method: 'yoomoney',
                subscription_type: subscription.period,
                amount: subscription.price,
                screenshot: base64File,
                screenshot_name: window.PaymentsManager.currentFile.name
            };

            // Отправляем данные в бота
            const success = TelegramAPI.sendWebAppData('payment_screenshot', paymentData);

            if (success) {
                this.showNotification('Скриншот отправлен на проверку! Ожидайте подтверждения.', 'success');

                // Сбрасываем форму
                window.PaymentsManager.removeFile('yoomoney');

                // Возвращаемся на главную страницу
                setTimeout(() => {
                    this.showPage('subscriptionPage');
                }, 2000);
            } else {
                this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
            }

        } catch (error) {
            console.error('Ошибка отправки оплаты:', error);
            this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
        }
    }

    // Отправка оплаты СБП
    async submitSbpPayment() {
        if (!window.PaymentsManager.currentFile) {
            this.showNotification('Пожалуйста, загрузите скриншот оплаты', 'error');
            return;
        }

        const subscription = this.currentSubscription;
        if (!subscription) {
            this.showNotification('Ошибка: не выбрана подписка', 'error');
            return;
        }

        try {
            // Конвертируем файл в base64
            const base64File = await window.PaymentsManager.fileToBase64(window.PaymentsManager.currentFile);

            const paymentData = {
                type: 'payment_screenshot',
                payment_method: 'sbp',
                subscription_type: subscription.period,
                amount: subscription.price,
                screenshot: base64File,
                screenshot_name: window.PaymentsManager.currentFile.name
            };

            // Отправляем данные в бота
            const success = TelegramAPI.sendWebAppData('payment_screenshot', paymentData);

            if (success) {
                this.showNotification('Скриншот отправлен на проверку! Ожидайте подтверждения.', 'success');

                // Сбрасываем форму
                window.PaymentsManager.removeFile('sbp');

                // Возвращаемся на главную страницу
                setTimeout(() => {
                    this.showPage('subscriptionPage');
                }, 2000);
            } else {
                this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
            }

        } catch (error) {
            console.error('Ошибка отправки оплаты:', error);
            this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
        }
    }

    // Копирование реквизитов
    copyRequisites(type) {
        let textToCopy = '';

        if (type === 'yoomoney') {
            textToCopy = document.getElementById('yoomoneyRequisites')?.textContent || '';
        } else if (type === 'sbp') {
            textToCopy = document.getElementById('sbpPhone')?.textContent || '';
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showNotification('Реквизиты скопированы!', 'success');
            }).catch(() => {
                // Fallback для старых браузеров
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('Реквизиты скопированы!', 'success');
            });
        }
    }

    // Удаление файла
    removeFile(type = 'yoomoney') {
        window.PaymentsManager.removeFile(type);
    }

    // Открытие CryptoBot инвойса
    openCryptoBotInvoice() {
        const invoiceUrl = this.currentCryptoInvoice?.invoice_url;
        if (invoiceUrl) {
            TelegramAPI.openLink(invoiceUrl);
        } else {
            this.showNotification('Счет не создан. Попробуйте еще раз.', 'error');
        }
    }

    // Проверка оплаты CryptoBot
    checkCryptoPayment() {
        const invoiceId = this.currentCryptoInvoice?.invoice_id;
        if (!invoiceId) {
            this.showNotification('Счет не найден', 'error');
            return;
        }

        const checkData = {
            type: 'check_crypto_payment',
            invoice_id: invoiceId
        };

        TelegramAPI.sendWebAppData('check_crypto_payment', checkData);
        this.showNotification('Проверяем статус оплаты...', 'info');
    }

    // Открытие CloudTips
    openCloudTips() {
        // Здесь будет ссылка на CloudTips
        const cloudtipsUrl = `https://cloudtips.com/payment?amount=${this.currentSubscription?.price || 390}`;
        TelegramAPI.openLink(cloudtipsUrl);
        this.showNotification('Переход к оплате CloudTips...', 'info');
    }
}

// Глобальные функции для onclick атрибутов
function showPage(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
}

function openSupport() {
    if (window.app) {
        window.app.openSupport();
    }
}

function refreshPrices() {
    if (window.app) {
        window.app.refreshPrices();
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramPremiumApp();
});

// Обработка сообщений от бота
window.addEventListener('message', (event) => {
    try {
        if (event.data && typeof event.data === 'string') {
            const data = JSON.parse(event.data);

            // Обработка данных от бота
            if (data.user_id && window.app) {
                window.app.userData = { ...window.app.userData, ...data };
                window.app.updateUI();
                
                // Если пришли новые цены, обновляем карточки
                if (data.prices) {
                    window.app.prices = data.prices;
                    window.app.renderSubscriptionCards();
                }
            }
        }
    } catch (error) {
        // Игнорируем не JSON сообщения
    }
});
