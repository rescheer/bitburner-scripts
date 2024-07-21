import { gameConfig, portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  // Ports
  const configPort = new PortWrapper(ns, portConfig.config);
  const deployerPort = new PortWrapper(ns, portConfig.deployer);
  // const statusPort = new PortWrapper(ns, portConfig.status);
  // const hacknetPort = new PortWrapper(ns, portConfig.hacknet);
  // const pServerPort = new PortWrapper(ns, portConfig.pServer);

  const getLongestNodeName = () => {
    const keys = Object.keys(deployerPort.peek());
    let length = 0;

    keys.forEach((key) => {
      if (key.length > length) length = key.length;
    });

    return length;
  };

  const calcProgress = (duration, timeLeft) => 100 - Math.round((100 * timeLeft) / duration);

  const convertToHHMMSS = (milliseconds) => {
    const d = new Date(0);
    d.setMilliseconds(milliseconds);
    return d.toISOString().substring(11, 19);
  };

  const createProgressBar = (progress, length) => {
    const { pBarActiveChar, pBarInactiveChar, pBarEndChars } = configPort.peekValue('monitor');

    const minTextVisibleLength = 4; // '100%'.length
    // 4 is a a good min value here, making each segment represent 25%
    // +2 for the start/end brackets (default '[' and ']')
    const minBarVisibleLength = 4 + minTextVisibleLength + 2;
    const actualLength = Math.max(length, minTextVisibleLength);
    const isTextOnly = actualLength < minBarVisibleLength;

    const progressString = `${progress}%`;
    const progressText = `${progressString.padStart(4, ' ')}`;

    let progressBar = '';

    if (!isTextOnly) {
      const barOnlyLength = actualLength - minTextVisibleLength - 2;
      const barProgress = Math.round(progress / (100 / barOnlyLength));
      let barOnly = pBarInactiveChar.repeat(barOnlyLength);

      for (let i = 1; i <= barProgress; i += 1) {
        barOnly = barOnly.replace(pBarInactiveChar, pBarActiveChar);
      }

      progressBar = `${pBarEndChars[0]}${barOnly}${pBarEndChars[1]}`;
    }

    return `${progressBar}${progressText}`;
  };

  const getNodeStatusStrings = (nodeArray, length) => {
    const results = [];
    const { separator } = configPort.peekValue('monitor');
    const totalSeparatorLength = separator.length * 5; // 6 sections, 5 separators
    const nameFieldLength = Math.max(getLongestNodeName(), 6);
    const taskFieldLength = 15;
    const moneyFieldLength = 5;
    const securityFieldLength = 8;
    const incomeFieldLength = 8;
    const lengthWithoutProgress = [
      totalSeparatorLength,
      nameFieldLength,
      taskFieldLength,
      moneyFieldLength,
      securityFieldLength,
      incomeFieldLength,
    ].reduce((total, num) => total + num);

    const extraLength = length - lengthWithoutProgress;
    const progressFieldLength = extraLength > 10 ? extraLength : 4;

    const nameHeader = 'Target';
    const taskHeader = 'Task';
    const progressHeader = 'Time';
    const moneyHeader = 'Money';
    const securityHeader = 'Security';
    const incomeHeader = '$/sec';

    const headersArray = [
      nameHeader,
      taskHeader.padStart(taskFieldLength),
      progressHeader.padStart(progressFieldLength),
      moneyHeader.padStart(moneyFieldLength),
      securityHeader.padStart(securityFieldLength),
      incomeHeader.padStart(incomeFieldLength),
    ];

    nodeArray.forEach((node) => {
      const nodeData = deployerPort.peekValue(node);
      const income = ns.getScriptIncome(gameConfig.scripts.deployer, gameConfig.home, node);
      const taskTimeLeft = Math.max(nodeData.expires - Date.now(), 0);
      const progress = calcProgress(nodeData.duration, taskTimeLeft);
      const securityDelta = nodeData.currentSecurity - nodeData.minSecurity;

      const nameField = node;
      const taskField = `${nodeData.type} ${convertToHHMMSS(taskTimeLeft)}`;
      const progressField = `${createProgressBar(progress, progressFieldLength)}`;
      const moneyField = `${Math.round((100 * nodeData.currentMoney) / nodeData.maxMoney)}%`;
      const securityField = `+${ns.formatNumber(securityDelta, 2)}`;
      const incomeField = `${ns.formatNumber(income, 1)}`;

      const stringsArray = [
        nameField,
        taskField.padStart(taskFieldLength),
        progressField,
        moneyField.padStart(moneyFieldLength),
        securityField.padStart(securityFieldLength),
        incomeField.padStart(incomeFieldLength),
      ];

      results.push(stringsArray.join(separator));
    });

    results.sort();
    results.forEach((el, i) => {
      results[i] = el.padStart(length);
    });

    results.unshift(headersArray.join(separator).padStart(length));
    return results;
  };

  ns.tail();
  ns.resizeTail(970, 900);

  while (true) {
    const { interval } = configPort.peekValue('monitor');
    const tailProps = ns.getRunningScript().tailProperties;

    ns.disableLog('ALL');

    if (tailProps) {
      const { width: tailWidth } = tailProps;
      // 1 char ~= 9.8px
      const charLength = Math.ceil(tailWidth / 9.8);
      const nodes = Object.keys(deployerPort.peek());
      ns.clearLog();
      getNodeStatusStrings(nodes, charLength).forEach((line) => {
        ns.print(line);
      });
    } else {
      ns.clearLog();
      ns.print('loading...');
    }

    await ns.sleep(interval);
  }
}
