const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const noblox = require('noblox.js');
const db = require('quick.db');

module.exports = class VerifyCommand extends BaseCommand {
  constructor() {
    super('verify', 'verification', []);
  }

  async run(client, message, args) {
    let roles = require('../../../roles.json');
    roles = roles.roles;

    function SendVerificationMessage(Title, Description, Color) {
      const Embed = new Discord.MessageEmbed()
        .setAuthor('MyGame Verification')
        .setTitle(Title)
        .setDescription(Description)
        .setColor(Color)
        .setFooter('This prompt will cancel in 2 minutes.')
        .setTimestamp()
      message.channel.send(Embed);
    }

    message.channel.send('**Starting verification process...**').then(editedMsg => {
      editedMsg.edit('**Awaiting prompt**');
      editedMsg.delete();

      function Generate() {
        let text = '';
        let randomstuff = ['art and sleep or add split or use', 'hand and plant or math and color', 'refuse to read or is full and fresh'];
        text += randomstuff[Math.floor(Math.random() * randomstuff.length)];
        return text;
      }
      const filter = m => m.author.id === message.author.id;
      const collector = message.channel.createMessageCollector(filter, {
        max: '1',
        maxMatches: '1',
        time: '120000',
        errors: ['time']
      })
      const embed = new Discord.MessageEmbed()
        .setTitle('MyGame Verification')
        .setDescription('❓ What is your ROBLOX username?')
        .setColor('BLUE')
        .setFooter('This prompt will cancel in 2 minutes.')
        .setTimestamp()
      message.channel.send(embed);
      collector.on('collect', m => {
        if (m.content.toLowerCase() === 'cancel') {
          SendVerificationMessage('Prompt', 'Cancelled the verification prompt.', 'RED')
          return;
        }
        noblox.getIdFromUsername(m.content).then(foundUser => {
          const UserId = foundUser;
          const string = Generate()
          SendVerificationMessage(`Hello, ${m.content}!`, 'To verify that you own this account, please put this in your ROBLOX blurb or status:\n\n`' + string + '`\n\nWhen you have completed this, say `done`.\nIf you wish to cancel the verification process, say `cancel`.', 'BLUE')
          const collector2 = message.channel.createMessageCollector(filter, {
            max: '1',
            maxMatches: '1',
            time: '120000',
            errors: ['time']
          })
          collector2.on('collect', async msg => {
            if (msg.content.toLowerCase() === 'done' && msg.author.id === message.author.id) {
              message.channel.send(`**Searching for ${string} on ${m.content}**`).then(async message1 => {
                setTimeout(function () {
                  noblox.getStatus(UserId).then(async status => {
                    noblox.getBlurb(UserId).then(async blurb => {
                      if (status.includes(string) || blurb.includes(string)) {
                        await db.set(`${message.author.id}.username`, m.content)
                        message1.edit('**You are now verified as `' + m.content + '`!**\nPlease wait for your roles.')
                        let verifiedRole = await message.guild.roles.cache.find(role => role.name === 'Verified')
                        await message.member.roles.add(verifiedRole)
                        await message.member.setNickname(m.content)

                        // Get Roles
                        const groupRank = await noblox.getRankNameInGroup(7368077, UserId)
                        let removedRoles = ['None'];
                        let addedRoles = ['None'];
                        for (let i = 0; i < roles.length; i++) {
                          if (groupRank === roles[i] && !message.member.roles.cache.has(message.guild.roles.cache.find(role => role.name === roles[i]).id)) {
                            let roleToAdd = message.guild.roles.cache.find(role => role.name === roles[i]);
                            if (addedRoles.includes('None')) addedRoles.shift();
                            message.member.roles.add(roleToAdd);
                            addedRoles.push(roles[i]);
                          }
                          if (message.member.roles.cache.has(message.guild.roles.cache.find(role => role.name === roles[i]).id) && groupRank !== roles[i]) {
                            let roleToRemove = message.guild.roles.cache.find(role => role.name === roles[i]);
                            if (removedRoles.includes('None')) removedRoles.shift();
                            message.member.roles.remove(roleToRemove);
                            removedRoles.push(roles[i]);
                          }
                        }

                        const updatedRoles = new Discord.MessageEmbed()
                          .setTitle('Updated Roles for ' + message.author.tag)
                          .setColor('GREEN')
                          .setFooter('YourBotName', client.user.displayAvatarURL())
                          .setDescription('I have updated roles for ' + message.author.tag)
                          .addFields({
                            name: 'Added Roles',
                            value: addedRoles.join(', '),
                            inline: true
                          }, {
                            name: 'Removed Roles',
                            value: removedRoles.join(", "),
                            inline: true
                          })

                        message1.edit('**You are now verified as `' + m.content + '`!**')
                        message.channel.send(updatedRoles)
                      } else {
                        message.channel.send(`**I couldn't find the text in your status or blurb. Please try again.**`);
                      }
                    })
                  })
                }, 5000);
              })
            } else if (msg.content.toLowerCase() === 'cancel' && msg.author.id === message.author.id) {
              SendVerificationMessage('Prompt', 'Cancelled the verification prompt.', 'RED')
            }
          })
        })
      })
    })
  }
}