// Логика оплат и Drag & Drop
class PaymentsManager {
    constructor() {
        this.currentFile = null;
        this.currentPaymentType = null;
        this.currentSubscription = null;
        this.init();
    }

    init() {
        this.setupFileUpload('fileInput', 'uploadArea', 'filePreview', 'previewImage', 'fileName', 'fileSize', 'submitPaymentBtn');
        this.setupFileUpload('fileInputSbp', 'uploadAreaSbp', 'filePreviewSbp', 'previewImageSbp', 'fileNameSbp', 'fileSizeSbp', 'submitSbpBtn');
        console.log('PaymentsManager инициализирован');
    }

    // Настройка Drag & Drop для загрузки файлов
    setupFileUpload(inputId, areaId, previewId, imageId, nameId, sizeId, submitBtnId) {
        const fileInput = document.getElementById(inputId);
        const uploadArea = document.getElementById(areaId);
        const filePreview = document.getElementById(previewId);
        const previewImage = document.getElementById(imageId);
        const fileName = document.getElementById(nameId);
        const fileSize = document.getElementById(sizeId);
        const submitBtn = document.getElementById(submitBtnId);

        if (!fileInput || !uploadArea) return;

        // Клик по области открывает диалог выбора файла
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Обработка перетаскивания файлов
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0], fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn);
            }
        });

        // Обработка выбора файла через диалог
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0], fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn);
            }
        });
    }

    // Обработка выбранного файла
    handleFileSelect(file, fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn) {
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            this.showNotification('Пожалуйста, выберите изображение (JPG, PNG)', 'error');
            return;
        }

        // Проверка размера
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Файл слишком большой. Максимум 5MB', 'error');
            return;
        }

        this.currentFile = file;

        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);

            uploadArea.style.display = 'none';
            filePreview.style.display = 'flex';

            // Активируем кнопку отправки
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    // Удаление файла
    removeFile(type = 'yoomoney') {
        const elements = this.getUploadElements(type);
        if (!elements) return;

        const { fileInput, uploadArea, filePreview, submitBtn } = elements;

        fileInput.value = '';
        this.currentFile = null;

        uploadArea.style.display = 'block';
        filePreview.style.display = 'none';

        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    // Получение элементов для типа оплаты
    getUploadElements(type) {
        if (type === 'yoomoney') {
            return {
                fileInput: document.getElementById('fileInput'),
                uploadArea: document.getElementById('uploadArea'),
                filePreview: document.getElementById('filePreview'),
                submitBtn: document.getElementById('submitPaymentBtn')
            };
        } else if (type === 'sbp') {
            return {
                fileInput: document.getElementById('fileInputSbp'),
                uploadArea: document.getElementById('uploadAreaSbp'),
                filePreview: document.getElementById('filePreviewSbp'),
                submitBtn: document.getElementById('submitSbpBtn')
            };
        }
        return null;
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Отправка оплаты ЮMoney
    async submitYoomoneyPayment() {
        if (!this.currentFile) {
            this.showNotification('Пожалуйста, загрузите скриншот оплаты', 'error');
            return;
        }

        const subscription = window.app.currentSubscription;
        if (!subscription) {
            this.showNotification('Ошибка: не выбрана подписка', 'error');
            return;
        }

        try {
            // Конвертируем файл в base64
            const base64File = await this.fileToBase64(this.currentFile);

            const paymentData = {
                type: 'payment_screenshot',
                payment_method: 'yoomoney',
                subscription_type: subscription.period,
                amount: subscription.price,
                screenshot: base64File,
                screenshot_name: this.currentFile.name
            };

            // Отправляем данные в бота
            const success = TelegramAPI.sendWebAppData('payment_screenshot', paymentData);

            if (success) {
                this.showNotification('Скриншот отправлен на проверку! Ожидайте подтверждения.', 'success');

                // Сбрасываем форму
                this.removeFile('yoomoney');

                // Возвращаемся на главную страницу
                setTimeout(() => {
                    window.app.showPage('subscriptionPage');
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
        if (!this.currentFile) {
            this.showNotification('Пожалуйста, загрузите скриншот оплаты', 'error');
            return;
        }

        const subscription = window.app.currentSubscription;
        if (!subscription) {
            this.showNotification('Ошибка: не выбрана подписка', 'error');
            return;
        }

        try {
            // Конвертируем файл в base64
            const base64File = await this.fileToBase64(this.currentFile);

            const paymentData = {
                type: 'payment_screenshot',
                payment_method: 'sbp',
                subscription_type: subscription.period,
                amount: subscription.price,
                screenshot: base64File,
                screenshot_name: this.currentFile.name
            };

            // Отправляем данные в бота
            const success = TelegramAPI.sendWebAppData('payment_screenshot', paymentData);

            if (success) {
                this.showNotification('Скриншот отправлен на проверку! Ожидайте подтверждения.', 'success');

                // Сбрасываем форму
                this.removeFile('sbp');

                // Возвращаемся на главную страницу
                setTimeout(() => {
                    window.app.showPage('subscriptionPage');
                }, 2000);
            } else {
                this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
            }

        } catch (error) {
            console.error('Ошибка отправки оплаты:', error);
            this.showNotification('Ошибка отправки. Попробуйте еще раз.', 'error');
        }
    }

    // Конвертация файла в base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Показ уведомлений
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Возможность закрыть кликом
        notification.addEventListener('click', () => {
            notification.remove();
        });
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

    // Открытие CryptoBot инвойса
    openCryptoBotInvoice() {
        const invoiceUrl = window.app.currentCryptoInvoice?.invoice_url;
        if (invoiceUrl) {
            TelegramAPI.openLink(invoiceUrl);
        } else {
            this.showNotification('Счет не создан. Попробуйте еще раз.', 'error');
        }
    }

    // Проверка оплаты CryptoBot
    checkCryptoPayment() {
        const invoiceId = window.app.currentCryptoInvoice?.invoice_id;
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
        const cloudtipsUrl = `https://cloudtips.com/payment?amount=${window.app.currentSubscription?.price || 390}`;
        TelegramAPI.openLink(cloudtipsUrl);
        this.showNotification('Переход к оплате CloudTips...', 'info');
    }
}

// Создаем глобальный экземпляр
window.PaymentsManager = new PaymentsManager();