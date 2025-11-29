// Вспомогательные функции
class Utils {
    // Форматирование числа с пробелами
    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Форматирование цены
    static formatPrice(price) {
        return this.formatNumber(price) + ' ₽';
    }

    // Генерация случайного ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Проверка мобильного устройства
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Проверка Touch устройств
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Дебаунс функция
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Локальное хранилище
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Ошибка сохранения в localStorage:', error);
                return false;
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('Ошибка чтения из localStorage:', error);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Ошибка удаления из localStorage:', error);
                return false;
            }
        }
    };

    // Валидация email
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Валидация телефона
    static validatePhone(phone) {
        const re = /^[\+]?[78][-(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/;
        return re.test(phone.replace(/\s/g, ''));
    }

    // Получение параметров URL
    static getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split('=');
            if (pair[0]) {
                params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
        }

        return params;
    }

    // Анимация плавного скролла
    static smoothScrollTo(element, duration = 500) {
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    // Копирование текста в буфер обмена
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    // Загрузка изображения
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Задержка
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Создаем глобальный экземпляр
window.Utils = Utils;