# Discord.js v14 Giveaway Bot

Discord.js v14 ile geliştirilmiş, JSON tabanlı veri saklama ve Components V2 panelleri kullanan bir Discord çekiliş botu.

## Özellikler

- Slash komut sistemi
- Components V2 çekiliş panelleri
- Buton ile çekilişe katılma
- Çekiliş durumu görüntüleme
- Otomatik çekiliş sonlandırma
- Rastgele kazanan belirleme
- Yeniden kazanan seçme
- JSON tabanlı veri saklama
- Bot yeniden başlatıldığında aktif çekilişleri geri yükleme
- Renkli terminal log sistemi
- Hata yönetimi

## Kurulum

```bash
git clone https://github.com/BenIbo20/discordjs-v14-giveaway-bot.git
cd discordjs-v14-giveaway-bot
npm install
```

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun.

## Yapılandırma

```env
BOT_TOKEN=
CLIENT_ID=
GUILD_ID=
LOG_TIMEZONE=Europe/Istanbul
```

## Kullanım

.env Dosyası oluşturmak için:

```bash
cp .env.example .env
```

Slash komutlarını Discord'a kaydetmek için:

```bash
npm run deploy
```

Botu başlatmak için:

```bash
npm start
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `/giveaway create` | Yeni çekiliş oluşturur |
| `/giveaway end` | Çekilişi sonlandırır |
| `/giveaway reroll` | Yeniden kazanan seçer |
| `/giveaway list` | Aktif çekilişleri listeler |

## Veri Saklama

Çekiliş bilgileri JSON dosyalarında saklanır. Bot yeniden başlatıldığında aktif çekilişler ve katılımcılar korunur.

## Lisans

MIT License

---

**Developed by [BenIbo20](https://github.com/BenIbo20)**