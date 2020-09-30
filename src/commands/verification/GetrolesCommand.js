const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const db = require('quick.db');
const noblox = require('noblox.js');

module.exports = class GetrolesCommand extends BaseCommand {
  constructor() {
    super('getroles', 'verification', []);
  }

  async run(client, message, args) {
    const username = db.fetch(`${message.author.id}.username`)

    if (username === null || username === undefined || username === []) {
      const errorEmbed = new Discord.MessageEmbed()
        .setDescription('❌ | You are not verified with Discord Bot! Please run `-verify` first.')
        .setColor('RED')
      return message.channel.send(errorEmbed);
    }

    let roles = require('../../../roles.json');
    roles = roles.roles;

    const UserId = await noblox.getIdFromUsername(username).catch(err => console.error(err));
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

    message.channel.send(updatedRoles)
  }
}