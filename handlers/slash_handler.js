const {
  Client,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Guild,
} = require("discord.js");
const fs = require("fs");
const ee = require("../settings/embed.json");
const { Queue } = require("distube");
const emoji = require("../settings/emoji.json");

/**
 *
 * @param {Client} client
 */

module.exports = async (client) => {
  try {
    client.arrayOfcommands = [];
    fs.readdirSync("./commands").forEach((cmd) => {
      let commands = fs
        .readdirSync(`./commands/${cmd}/`)
        .filter((file) => file.endsWith(".js"));
      for (cmds of commands) {
        let pull = require(`../commands/${cmd}/${cmds}`);
        if (pull.options) {
          pull.options
            .filter((g) => g.type === "SUB_COMMAND")
            .forEach((sub) => {
              client.subcmd.set(sub.name, sub);
            });
        }
        if (pull.name) {
          client.commands.set(pull.name, pull);
          client.arrayOfcommands.push(pull);
        } else {
          continue;
        }
      }
    });

    client.on("ready", async () => {
      try {
        await client.guilds.fetch()
        let commands = await client.commands.map((cmd) => cmd);
        await client.guilds.cache.forEach(async (guild) => {
          await guild.commands.set(commands).catch(e => {})
        })
      } catch (e) {
        console.log(e);
      }
    });

    console.log(` Loaded ${client.commands.size} commands `);
  } catch (e) {
    console.log(e);
  }
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {String} data
   */
  client.embed = (interaction, data) => {
    return interaction.followUp({
      embeds: [
        new MessageEmbed()
          .setColor(ee.color)
          .setDescription(data.substring(0, 2000))
          .setFooter({
            text: ee.footertext,
            iconURL: ee.footericon,
          }),
      ],
    });
  };
  client.buttons = new MessageActionRow().addComponents([
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("playp")
      .setLabel("Previous")
      .setEmoji(emoji.previous_track),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("pause")
      .setLabel("Pause")
      .setEmoji(emoji.pause_resume),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("skip")
      .setLabel("Skip")
      .setEmoji(emoji.skip_track),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("loop")
      .setLabel("Off")
      .setEmoji(emoji.repeat_mode),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("stop")
      .setLabel("Stop")
      .setEmoji(emoji.stop),
  ]);
  client.buttons2 = new MessageActionRow().addComponents([
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("playp")
      .setLabel("Previous")
      .setEmoji(emoji.previous_track)
      .setDisabled(true),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("pause")
      .setLabel("Pause")
      .setEmoji(emoji.pause_resume)
      .setDisabled(true),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("skip")
      .setLabel("Skip")
      .setEmoji(emoji.skip_track)
      .setDisabled(true),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("loop")
      .setLabel("Off")
      .setDisabled(true)
      .setEmoji(emoji.repeat_mode),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId("stop")
      .setLabel("Stop")
      .setDisabled(true)
      .setEmoji(emoji.stop),
  ]);

  // embed
  client.queueEmed = new MessageEmbed()
    .setColor("#b103fc")
    .setTitle(`There are \`0\` in Queue`);

  client.playembed = new MessageEmbed()
    .setColor("#b103fc")
    .setTitle(`Join Voice Channel to Play Song`)
    .setImage(
      `https://cdn.discordapp.com/attachments/954966856303788052/958456029891407892/disrupt-music-industry.jpg`
    )
    .setDescription(
      `>>> ** I Support YouTube | Spotify | SoundCloud **`
    );

  // function

  /**
   *
   * @param {Queue} queue
   */
  client.updateplaymsg = async function (queue) {
    let data = client.music.get(queue.textChannel.guildId);
    if (data.enable === false) return;
    let song = queue.songs[0];
    let channel = await queue.textChannel.guild.channels.cache.get(
      data.channel
    );
    if (!channel) return;
    let msg = await channel.messages.fetch(data.playmsg, {
      cache: true,
      force: true,
    });
    if (!msg) return;
    msg.edit({
      embeds: [
        new MessageEmbed()
          .setColor("RANDOM")
          .setDescription(
            `[\`${song.name}\`](${song.url}) \`[${song.formattedDuration}]\``
          )
          .setImage(song.thumbnail)
          .setFooter({
            text: `Requsted By ${song.user.tag}`,
            iconURL: song.thumbnail,
          }),
      ],
      components: [client.buttons],
    });
    client.temp.set(queue.textChannel.guildId, msg.id);
  };
  /**
   *
   * @param {Queue} queue
   */
  client.updatequeuemsg = async function (queue) {
    let data = client.music.get(queue.textChannel.guildId);
    if (data.enable === false) return;
    let channel = await queue.textChannel.guild.channels.cache.get(
      data.channel
    );
    if (!channel) return;
    let msg = await channel.messages.fetch(data.queuemsg, {
      cache: true,
      force: true,
    });
    if (!msg) return;
    let songs = await queue.songs
      .filter((t, i) => i < 10)
      .map((song, index) => {
        return `\`${index + 1}\` [\`${song.name}\`](${song.url}) __**${
          song.user.tag
        }**__`;
      })
      .join("\n\n")
      .substring(0, 3000);

    msg.edit({
      embeds: [
        new MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`${queue.songs.length} Songs in Queue`)
          .setDescription(songs)
          .setFooter({
            text: queue.textChannel.guild.name,
            iconURL: queue.textChannel.guild.iconURL({ dynamic: true }),
          }),
      ],
    });
  };
  /**
   *
   * @param {Guild} guild
   */
  client.updatemusic = async function (guild) {
    let data = client.music.get(guild.id);
    if (data.enable === false) return;
    let channel = await guild.channels.cache.get(data.channel);
    if (!channel) return;
    let Playmsg = await channel.messages.fetch(data.playmsg, {
      cache: true,
      force: true,
    });
    if (!Playmsg) return;
    let Queuemsg = await channel.messages.fetch(data.queuemsg, {
      cache: true,
      force: true,
    });
    if (!Queuemsg) return;
    await Playmsg.edit({
      embeds: [client.playembed],
      components: [client.buttons2],
    });
    await Queuemsg.edit({
      embeds: [client.queueEmed],
    });
  };
};
