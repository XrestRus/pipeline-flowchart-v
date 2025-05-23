# Настройка nginx аутентификации для phpMyAdmin

## Создание пользователя и пароля

Для создания файла `.htpasswd` с учетными данными для доступа к phpMyAdmin, выполните следующие шаги:

### Метод 1: Использование утилиты htpasswd (Apache Utils)

1. Установите утилиту, если она еще не установлена:

```bash
# На Ubuntu/Debian
sudo apt-get install apache2-utils

# На CentOS/RHEL
sudo yum install httpd-tools

# На macOS (через Homebrew)
brew install httpd
```

2. Создайте файл `.htpasswd` с новым пользователем:

```bash
htpasswd -c nginx/.htpasswd admin
```

3. Вам будет предложено ввести и подтвердить пароль.

4. Чтобы добавить еще одного пользователя (без опции `-c`, которая создает новый файл):

```bash
htpasswd nginx/.htpasswd another_user
```

### Метод 2: Использование OpenSSL

Если у вас нет доступа к утилите htpasswd, можно использовать OpenSSL:

```bash
# Генерация пароля и сохранение в файл
printf "admin:$(openssl passwd -apr1 YOUR_PASSWORD)\n" > nginx/.htpasswd
```

Замените `YOUR_PASSWORD` на желаемый пароль.

### Метод 3: Использование онлайн-генератора

Вы можете воспользоваться онлайн-генератором htpasswd, а затем скопировать полученную строку в файл nginx/.htpasswd.

## Важно!

* Файл `.htpasswd` содержит чувствительную информацию, не включайте его в репозиторий.
* Добавьте `.htpasswd` в ваш `.gitignore`.
* Сохраните пароль в надежном месте (менеджере паролей).

## Проверка доступа

После настройки:
1. Запустите Docker Compose: `docker-compose up -d`
2. Откройте браузер и перейдите по адресу: `http://localhost/phpmyadmin/`
3. Должен появиться запрос на ввод учетных данных, которые вы настроили. 