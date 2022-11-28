import { GuardFunction, ArgsOf, Client, Next } from "discordx";
export const NoBot: GuardFunction<ArgsOf<"messageCreate">> = async (
  args: ArgsOf<"messageCreate">,
  client: Client,
  next: Next
) => {
  var message = args[0];

  if (
    !message ||
    (message.author &&
      client.user?.id !== message.author?.id &&
      !message.author.bot)
  ) {
    await next();
  }
};
