FROM wordpress:6-php8.2

# Install WP-CLI for data import scripts
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

COPY wp-cli-init.sh /usr/local/bin/wp-cli-init.sh
RUN chmod +x /usr/local/bin/wp-cli-init.sh
