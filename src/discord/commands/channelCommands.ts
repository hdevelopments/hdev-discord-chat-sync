import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AttachmentBuilder,
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  ForumChannel,
  GuildMember,
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
  MessagePayload,
  ModalBuilder,
  ModalSubmitInteraction,
  TextBasedChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SlashOption,
  SlashChoice,
  ContextMenu,
  ModalComponent,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import { ObjectID } from "ts-mongodb-orm";
import { asyncForEach } from "../../utils/syncModerationUtils";
import bot from "../../main";
import { options } from "./syncModeration";
import Logs from "../../utils/Logs";
import GlobalConfigService from "../../services/GloablConfigService";

@Discord()
@SlashGroup({
  description: "Some Chat Options",
  name: "chat",
  dmPermission: false,
})
@SlashGroup("chat")
@Guard(noDms)
class channelCommands {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private globalConfig: GlobalConfigService;
  @Slash({
    description: "Shows you the information about this Channel.",
  })
  async info(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var found = await this.guildConfigService.getByChannel(
      interaction.guildId!,
      interaction.channelId
    );
    var category = await this.guildConfigService.findCategory(
      new ObjectID(found?.category)
    );
    if (category) {
      var allFound = await this.guildConfigService.getAllByCategoryId(
        found?.category!
      );
      var foundText = "------\n";

      await asyncForEach(allFound, async (x) => {
        try {
          var foundGuild = await bot.guilds.fetch(x.guild);
          foundText += `**${foundGuild.name}** | ${x.guild} \n`;
        } catch (exc) {}
      });

      var owner = "Not Available";
      try {
        owner = category.owner
          ? (
              await bot.users.fetch(
                typeof category.owner === "string"
                  ? category.owner
                  : category.owner.user
              )
            ).username
          : "Public";
      } catch (exc) {
        owner = "Not Available";
      }
      var embed = new EmbedBuilder().setTitle("Information");
      embed.addFields(
        { name: "Category:", value: category.name },
        { name: "NSFW:", value: String(category.nsfw) },
        {
          name: "Owner:",
          value: owner,
        },
        { name: "Servers:", value: foundText }
      );
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply("This isnt a Chat Sync chat!");
    }
  }

  @Slash({
    description: "Lets you set some options.",
  })
  async set(
    @SlashChoice(
      ...Object.entries(options)
        .filter((x) => !x[1].globalOnly)
        .map((data) => {
          return { name: data[0], value: data[0] };
        })
    )
    @SlashOption({
      description: "The Option",
      name: "option",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    option: string,
    @SlashOption({
      description: "The new Value",
      name: "value",
      autocomplete: channelCommands.optionCompleter,
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    newValue: any,
    @SlashOption({
      description: "The chanel",
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
    })
    channel: TextBasedChannel,
    interaction: CommandInteraction
  ) {
    if (!options[option].options.includes(newValue)) {
      await interaction.reply({
        ephemeral: true,
        content: "You need to select one of the given options!",
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    var config = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );

    var foundchannel = config.channels[channel?.id || interaction.channelId];

    if (!foundchannel) {
      interaction.editReply("Sorry the choosen channel isnt a sync channel!");
      return;
    }
    if (!foundchannel.configs) {
      foundchannel.configs = {};
    }
    foundchannel.configs[option] = newValue;
    await this.guildConfigService.save(config);
    await interaction.editReply("Success!");
  }

  @Slash({
    description: "Let you report a User or Server.",
  })
  async report(
    @SlashChoice("Server", "User")
    @SlashOption({
      description: "Type",
      name: "type",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    type: string,
    @SlashOption({
      description: "The User/ServerId",
      name: "id",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    id: string,
    @SlashChoice("Public", "Private")
    @SlashOption({
      description: "Private or Public Topic?",
      name: "privateorpublic",
      type: ApplicationCommandOptionType.String,
    })
    topictype: "Public" | "Private",

    @SlashOption({
      description: "What did he do?",
      name: "reason",
      type: ApplicationCommandOptionType.String,
    })
    reason: string,
    @SlashOption({
      description: "The Message ID",
      name: "messageid",
      type: ApplicationCommandOptionType.String,
    })
    messageId: string,
    interaction: CommandInteraction
  ) {
    if (await this.globalConfig.isBlacklistedUser(interaction.user.id)) {
      interaction.reply({ content: "You are Blacklisted!", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });

    await Logs.SendLog({
      content: `User Reported a ${type}!
      Id: ${id}
      Reason: ${reason}
      Topic: ${topictype}
      
      Reporter: ${interaction.user.username}@${interaction.user.discriminator} ${interaction.user.id}`,
    });
    if (messageId) {
      interaction.channel?.messages
        .fetch(messageId)
        .then((x) => {
          Logs.SendLog({
            content: x.content,
            embeds: x.embeds,
            files: x.attachments.toJSON(),
          });
        })
        .catch((x) => console.log(x));
    }
    await interaction.editReply("Success!");
  }

  @ContextMenu({
    type: ApplicationCommandType.Message,
    name: "Report a Message",
  })
  async reportMessage(interaction: MessageContextMenuCommandInteraction) {
    if (
      !(await this.guildConfigService.getByChannel(
        interaction.guildId!,
        interaction.channelId
      ))
    ) {
      interaction.reply({
        content: "Only in a Cross Server Chat!",
        ephemeral: true,
      });
      return;
    }
    // Create the modal
    const modal = new ModalBuilder()
      .setTitle("Report a Message")
      .setCustomId("reportMessageForm");

    // Create text input fields
    const reportedUserComponent = new TextInputBuilder()
      .setCustomId("reportedUser")
      .setLabel("The Reported User")
      .setStyle(TextInputStyle.Short)
      .setValue(
        `@${interaction.targetMessage.author.tag} | ${interaction.targetMessage.author.id}`
      )
      .setRequired(true);

    // Create text input fields
    const messageIdComponent = new TextInputBuilder()
      .setCustomId("messageUrl")
      .setLabel("The Url to the Message")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Somewhat we can identify the Message")
      .setValue(
        `https://discordapp.com/channels/${interaction.guildId}/${interaction.targetMessage.channelId}/${interaction.targetId}`
      )
      .setRequired(true);

    const reasonComponent = new TextInputBuilder()
      .setCustomId("reasonText")
      .setLabel("Reason:")
      .setPlaceholder(
        "Write here your concern! ( Best with a screenshot! [Upload it somewhere])"
      )
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      reportedUserComponent
    );

    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      messageIdComponent
    );

    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      reasonComponent
    );

    modal.addComponents(row1, row2, row3);

    interaction.showModal(modal);
  }

  @ContextMenu({
    type: ApplicationCommandType.User,
    name: "Report a User",
  })
  async reportUser(interaction: MessageContextMenuCommandInteraction) {
    if (
      !(await this.guildConfigService.getByChannel(
        interaction.guildId!,
        interaction.channelId
      ))
    ) {
      interaction.reply({
        content: "Only in a Cross Server Chat!",
        ephemeral: true,
      });
      return;
    }
    // Create the modal
    const modal = new ModalBuilder()
      .setTitle("Report a User")
      .setCustomId("reportMessageForm");

    // Create text input fields
    const reportedUserComponent = new TextInputBuilder()
      .setCustomId("reportedUser")
      .setLabel("The Reported User")
      .setStyle(TextInputStyle.Short)
      .setValue(
        `${interaction.targetMessage.author.username}@${interaction.targetMessage.author.discriminator} | ${interaction.targetMessage.author.id}`
      )
      .setRequired(true);

    // Create text input fields
    const messageIdComponent = new TextInputBuilder()
      .setCustomId("messageUrl")
      .setLabel("The Url to the User")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Somewhat we can identify the User")
      .setValue(
        `https://discordapp.com/users/${interaction.targetMessage.author.id}`
      )
      .setRequired(true);

    const reasonComponent = new TextInputBuilder()
      .setCustomId("reasonText")
      .setLabel("Reason:")
      .setPlaceholder(
        "Write here your concern! ( Best with a screenshot! [Upload it somewhere])"
      )
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      reportedUserComponent
    );

    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      messageIdComponent
    );

    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      reasonComponent
    );

    modal.addComponents(row1, row2, row3);

    interaction.showModal(modal);
  }
  @ModalComponent()
  async reportMessageForm(interaction: ModalSubmitInteraction) {
    const [messageUrl, reasonText, reportedUser] = [
      "messageUrl",
      "reasonText",
      "reportedUser",
    ].map((id) => interaction.fields.getTextInputValue(id));

    await interaction.reply({
      content: `You reported the user: ${reportedUser} with the reason: ${reasonText}`,
      ephemeral: true,
    });

    var embed = new EmbedBuilder()
      .setTitle(
        "Report from " +
          interaction.member?.user.username +
          "@" +
          interaction.member?.user.discriminator
      )
      .addFields([
        {
          name: "Reporter: ",
          value:
            (interaction.member?.toString() || interaction.user.username) +
            `https://discordapp.com/users/${interaction.user.id}`,
          inline: true,
        },
        {
          name: "Reported User/Server: ",
          value: reportedUser,
          inline: true,
        },
        {
          name: "Reason: ",
          value: reasonText,
        },
        {
          name: "Reported Message: ",
          value: messageUrl,
        },
      ]);
    var reportForum = (await interaction.guild?.channels.fetch(
      process.env.DEV ? "1064507101684170852" : "1064507877135495199"
    )) as ForumChannel;
    var tags = reportForum.availableTags;
    reportForum.threads.create({
      name: "[BOT-Report] " + (interaction.member as GuildMember).displayName,
      appliedTags: tags
        .filter((x) => ["Report"].includes(x.name))
        .map((x) => x.id),
      message: { embeds: [embed] },
    });
    return;
  }
  static optionCompleter(interaction: AutocompleteInteraction) {
    var option = interaction.options.getString("option");
    if (!option) {
      interaction.respond([{ name: "please select a option!", value: "no" }]);
      return;
    }

    interaction.respond(
      options[option].options.map((x) => {
        return { name: x, value: x };
      })
    );
  }
}
