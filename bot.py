import os

import telebot

from sqlalchemy import create_engine

env = os.environ.get('ENV')
if env == 'dev':
    print('Development bot starting')
elif env == 'prod':
    print('Production bot starting')
# Replace the connection string with your actual connection string
connection_string = os.environ.get('DB_URL')

# Create a SQLAlchemy engine
engine = create_engine(connection_string)

# Connect to the database
try:
    connection = engine.connect()
    print("Connected to the database!")

    # You can now execute SQL queries using this connection object

    # # For example, you can execute a simple query to fetch data
    # result = connection.execute("SELECT * FROM your_table")
    # for row in result:
    #     print(row)

    # Close the connection when you're done
    connection.close()

except Exception as e:
    print("Error:", str(e))


# from utils import get_daily_horoscope

BOT_TOKEN = os.environ.get('BOT_TOKEN')

bot = telebot.TeleBot(BOT_TOKEN)


@bot.message_handler(commands=['start', 'hello'])
def send_welcome(message):
    bot.reply_to(message, "Howdy, how are you doing?")


@bot.message_handler(commands=['horoscope'])
def sign_handler(message):
    text = "What's your zodiac sign?\nChoose one: *Aries*, *Taurus*, *Gemini*, *Cancer,* *Leo*, *Virgo*, *Libra*, *Scorpio*, *Sagittarius*, *Capricorn*, *Aquarius*, and *Pisces*."
    sent_msg = bot.send_message(message.chat.id, text, parse_mode="Markdown")
    bot.register_next_step_handler(sent_msg, day_handler)


def day_handler(message):
    sign = message.text
    text = "What day do you want to know?\nChoose one: *TODAY*, *TOMORROW*, *YESTERDAY*, or a date in format YYYY-MM-DD."
    sent_msg = bot.send_message(
        message.chat.id, text, parse_mode="Markdown")
    bot.register_next_step_handler(
        sent_msg, fetch_horoscope, sign.capitalize())


def fetch_horoscope(message, sign):
    day = message.text
    # horoscope = get_daily_horoscope(sign, day)
    # data = horoscope["data"]
    # horoscope_message = f'*Horoscope:* {data["horoscope_data"]}\n*Sign:* {sign}\n*Day:* {data["date"]}'
    bot.send_message(message.chat.id, "Here's your horoscope!")
    # bot.send_message(message.chat.id, horoscope_message, parse_mode="Markdown")


@bot.message_handler(func=lambda msg: True)
def echo_all(message):
    bot.reply_to(message, message.text)
    print(message.text)


bot.infinity_polling()
