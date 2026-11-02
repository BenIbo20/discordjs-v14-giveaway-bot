import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorSpacingSize
} from 'discord.js';

export const COLORS = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  DANGER: 0xED4245,
  DARK: 0x2B2D31
};

export function buildGiveawayPanel(giveaway) {
  const isEnded = giveaway.status === 'ended';
  const startUnix = Math.floor(giveaway.startTime / 1000);
  const endUnix = Math.floor(giveaway.endTime / 1000);

  const headerContent = isEnded
    ? `# 🛑 ÇEKİLİŞ SONA ERDİ: ${giveaway.prize.toUpperCase()}\n> Bu çekiliş tamamlanmıştır. Katılımlar kapatılmıştır.`
    : `# 🎉 ÇEKİLİŞ: ${giveaway.prize.toUpperCase()}\n> Aşağıdaki butona tıklayarak hemen çekilişe katılabilirsiniz!`;

  const headerDisplay = new TextDisplayBuilder().setContent(headerContent);

  let detailsContent = `🎁 **Ödül:** ${giveaway.prize}\n`;
  if (giveaway.description && giveaway.description.trim().length > 0) {
    detailsContent += `📝 **Açıklama:** ${giveaway.description.trim()}\n`;
  }
  detailsContent += `🏆 **Kazanan Sayısı:** \`${giveaway.winnerCount}\` kişi\n`;
  detailsContent += `👥 **Toplam Katılımcı:** \`${giveaway.participants.length}\` kişi`;

  const detailsDisplay = new TextDisplayBuilder().setContent(detailsContent);

  let metaContent = `⏰ **Başlangıç:** <t:${startUnix}:F>\n`;
  if (isEnded) {
    const endedUnix = giveaway.endedAt ? Math.floor(giveaway.endedAt / 1000) : endUnix;
    metaContent += `⏳ **Bitiş:** <t:${endedUnix}:F> (<t:${endedUnix}:R>)\n`;
    metaContent += `📌 **Durum:** Sona Erdi 🔴\n`;
    metaContent += `👤 **Düzenleyen:** <@${giveaway.createdBy}>\n\n`;

    if (giveaway.winners && giveaway.winners.length > 0) {
      const winnerMentions = giveaway.winners.map(id => `<@${id}>`).join(', ');
      metaContent += `🎊 **Kazanan(lar):** ${winnerMentions}\n> 🎁 Tebrik ederiz! Hediyeniz için sunucu yetkilileriyle iletişime geçin.`;
    } else {
      metaContent += `🎊 **Kazanan:** Katılımcı bulunmadığı için kazanan belirlenemedi. 😢`;
    }
  } else {
    metaContent += `⏳ **Kalan Süre / Bitiş:** <t:${endUnix}:R> (<t:${endUnix}:F>)\n`;
    metaContent += `📌 **Durum:** Devam Ediyor 🟢\n`;
    metaContent += `👤 **Düzenleyen:** <@${giveaway.createdBy}>`;
  }

  const metaDisplay = new TextDisplayBuilder().setContent(metaContent);

  const joinButton = new ButtonBuilder()
    .setCustomId(`giveaway_join:${giveaway.giveawayId}`)
    .setLabel('🎉 Çekilişe Katıl')
    .setStyle(isEnded ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setDisabled(isEnded);

  const statusButton = new ButtonBuilder()
    .setCustomId(`giveaway_status:${giveaway.giveawayId}`)
    .setLabel('📊 Çekiliş Durumu')
    .setStyle(ButtonStyle.Secondary);

  const actionRow = new ActionRowBuilder().addComponents(joinButton, statusButton);

  const sep1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const sep2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const sep3 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

  return new ContainerBuilder()
    .setAccentColor(isEnded ? COLORS.DANGER : COLORS.PRIMARY)
    .addTextDisplayComponents(headerDisplay)
    .addSeparatorComponents(sep1)
    .addTextDisplayComponents(detailsDisplay)
    .addSeparatorComponents(sep2)
    .addTextDisplayComponents(metaDisplay)
    .addSeparatorComponents(sep3)
    .addActionRowComponents(actionRow);
}

export function buildStatusPanel(giveaway, userId) {
  const isJoined = giveaway.participants.includes(userId);
  const isEnded = giveaway.status === 'ended';
  const startUnix = Math.floor(giveaway.startTime / 1000);
  const endUnix = Math.floor(giveaway.endTime / 1000);

  const headerDisplay = new TextDisplayBuilder().setContent(
    `# 📊 Çekiliş Durum Bilgisi\n> Seçili çekilişin güncel katılım ve süre bilgileri aşağıdadır.`
  );

  let details = `🎁 **Ödül:** ${giveaway.prize}\n`;
  details += `👥 **Toplam Katılımcı:** \`${giveaway.participants.length}\` kişi\n`;
  details += `🏆 **Kazanan Sayısı:** \`${giveaway.winnerCount}\` kişi\n`;
  details += `📌 **Durum:** ${isEnded ? 'Sona Erdi 🔴' : 'Devam Ediyor 🟢'}`;

  const detailsDisplay = new TextDisplayBuilder().setContent(details);

  let statusText = `⏰ **Başlangıç:** <t:${startUnix}:F>\n`;
  statusText += `⏳ **Bitiş:** <t:${endUnix}:F> (<t:${endUnix}:R>)\n`;
  statusText += `🎟️ **Katılım Durumunuz:** ${isJoined ? '**Katıldınız** ✅' : '**Katılmadınız** ❌'}\n\n`;

  if (isJoined) {
    statusText += `> 🎉 Çekilişte yerinizi aldınız! Bol şanslar dileriz.`;
  } else if (!isEnded) {
    statusText += `> 💡 Çekilişe katılmak için ana paneldeki **🎉 Çekilişe Katıl** butonuna tıklayabilirsiniz.`;
  } else {
    statusText += `> ⚠️ Çekiliş süresi dolduğu için yeni katılım sağlanamaz.`;
  }

  const userDisplay = new TextDisplayBuilder().setContent(statusText);

  const sep1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const sep2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

  return new ContainerBuilder()
    .setAccentColor(isJoined ? COLORS.SUCCESS : COLORS.PRIMARY)
    .addTextDisplayComponents(headerDisplay)
    .addSeparatorComponents(sep1)
    .addTextDisplayComponents(detailsDisplay)
    .addSeparatorComponents(sep2)
    .addTextDisplayComponents(userDisplay);
}

export function buildNoticePanel({ title, description, color = COLORS.PRIMARY }) {
  const headerDisplay = new TextDisplayBuilder().setContent(`# ${title}`);
  const sep = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const bodyDisplay = new TextDisplayBuilder().setContent(description);

  return new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(headerDisplay)
    .addSeparatorComponents(sep)
    .addTextDisplayComponents(bodyDisplay);
}

export function buildWinnerAnnouncement(giveaway, isReroll = false) {
  const title = isReroll ? '🎊 Yeniden Kazanan Belirlendi!' : '🎊 Çekiliş Sonuçlandı!';
  const header = new TextDisplayBuilder().setContent(
    `# ${title}\n> **${giveaway.prize}** çekilişinin kazananı/kazananları belli oldu!`
  );

  let result = `🎁 **Ödül:** ${giveaway.prize}\n`;
  if (giveaway.winners && giveaway.winners.length > 0) {
    const winnerMentions = giveaway.winners.map(id => `<@${id}>`).join(', ');
    result += `🏆 **Kazanan(lar):** ${winnerMentions}\n\n`;
    result += `> 🥳 Tebrik ederiz! Ödülünüzü teslim almak için lütfen sunucu yetkilileriyle iletişime geçin.`;
  } else {
    result += `🏆 **Kazanan:** Katılımcı bulunmadığı için kazanan seçilemedi. 😢`;
  }
  const body = new TextDisplayBuilder().setContent(result);

  const sep1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const sep2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
  const footer = new TextDisplayBuilder().setContent(
    `✨ [github.com/BenIbo20](https://github.com/BenIbo20)`
  );

  return new ContainerBuilder()
    .setAccentColor(COLORS.SUCCESS)
    .addTextDisplayComponents(header)
    .addSeparatorComponents(sep1)
    .addTextDisplayComponents(body)
    .addSeparatorComponents(sep2)
    .addTextDisplayComponents(footer);
}
