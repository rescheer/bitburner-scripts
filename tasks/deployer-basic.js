import PortWrapper from 'lib/PortWrapper';
import {
  gameConfig,
  PBAR_LENGTH,
  PBAR_ACTIVE_CHAR,
  PBAR_INACTIVE_CHAR,
  BASE_WIDTH,
  portConfig,
} from 'cfg/config';

/** @param {NS} ns * */
export async function main(ns) {
  const configPort = new PortWrapper(ns, portConfig.config);
  const statusPort = new PortWrapper(ns, portConfig.status);
  const deployerPort = new PortWrapper(ns, portConfig.deployer);
  let networkMap = {};
  let activeTarget = {};
  const currentTask = {
    active: false,
    target: '',
    type: '',
    duration: 0,
    expires: 0,
    threadInfo: {},
    scriptsRunning: [],
  };

  ns.atExit(() => {
    deployerPort.deleteValue(activeTarget.name);
    ns.closeTail();
  });

  const updateMissingRam = (val) => {
    const key = portConfig.statusKeys.missingRam;
    const oldValue = statusPort.peekValue(key);

    if (!oldValue || oldValue < val) {
      statusPort.writeValue(key, val);
    }
  };

  const calcHackThreads = (nodeData, moneyTarget) => {
    const { hackTime, name } = nodeData;
    const threadRam = ns.getScriptRam(gameConfig.scripts.hackThread, gameConfig.home);

    const threads = Math.ceil(ns.hackAnalyzeThreads(name, moneyTarget));
    if (threads === -1) {
      ns.tprint(`${name} has ${activeTarget.currentMoney} and we want ${moneyTarget}`);
    }
    const totalRam = threads * threadRam;

    return {
      threads,
      threadRam,
      totalRam,
      time: hackTime,
    };
  };

  const calcGrowThreads = (nodeData) => {
    const {
      currentMoney, maxMoney, growTime, name,
    } = nodeData;
    // Round up to 1 decimal place
    const deltaMult = (maxMoney / currentMoney) * 1.15;
    const threadRam = ns.getScriptRam(gameConfig.scripts.growThread, gameConfig.home);

    const threads = Math.ceil(ns.growthAnalyze(name, deltaMult));
    const totalRam = threads * threadRam;

    return {
      threads,
      threadRam,
      totalRam,
      time: growTime,
    };
  };

  const calcWeakenThreads = (nodeData) => {
    const { currentSecurity, minSecurity, weakenTime } = nodeData;
    const securityDelta = currentSecurity - minSecurity;
    const threadRam = ns.getScriptRam(gameConfig.scripts.weakenThread, gameConfig.home);
    const weakenEffect = ns.weakenAnalyze(1);

    const threads = Math.ceil(securityDelta / weakenEffect);
    const totalRam = threads * threadRam;

    return {
      threads,
      threadRam,
      totalRam,
      time: weakenTime,
    };
  };

  const distribute = (script, threadData) => {
    const { threads, threadRam } = threadData;
    let threadsRemaining = threads;

    // try all servers except for home
    Object.entries(networkMap).forEach(([node, nodeData]) => {
      if (threadsRemaining >= 1) {
        if (node !== gameConfig.home && nodeData.root) {
          const maxRam = ns.getServerMaxRam(node);
          const usedRam = ns.getServerUsedRam(node);
          const freeRam = maxRam - usedRam;
          const possibleThreads = Math.floor(freeRam / threadRam);

          if (possibleThreads >= 1) {
            const actualThreads = Math.min(possibleThreads, threadsRemaining);

            ns.scp(script, node, gameConfig.home);
            const pid = ns.exec(script, node, actualThreads, activeTarget.name);
            if (pid) {
              threadsRemaining -= actualThreads;
              currentTask.scriptsRunning.push({ node, pid });
            }
          }
        }
      }
    });

    // if we have threads left, dump them onto gameConfig.home
    // This is good for early game but could be problematic later
    if (threadsRemaining >= 1) {
      const maxRam = ns.getServerMaxRam(gameConfig.home);
      const usedRam = ns.getServerUsedRam(gameConfig.home);
      const freeRam = maxRam - usedRam;
      const possibleThreads = Math.floor(freeRam / threadRam);

      // Send low RAM signal, we don't want to use home Ram too much
      updateMissingRam(threadsRemaining * threadRam);

      if (possibleThreads >= 1) {
        const actualThreads = Math.min(possibleThreads, threadsRemaining);

        const pid = ns.exec(script, gameConfig.home, actualThreads, activeTarget.name);
        if (pid) {
          threadsRemaining -= actualThreads;
          currentTask.scriptsRunning.push({ node: gameConfig.home, pid });
        }
      }
    }

    // If we still have threads left, just skip them and request
    // the deficit RAM from the server manager
    if (threadsRemaining >= 1) {
      // Send low RAM signal
      updateMissingRam(threadsRemaining * threadRam);
    }

    const result = { threads, threadsRemaining, threadRam };
    return result;
  };

  const refreshTargetData = () => {
    const host = ns.args[0];

    const currentMoney = ns.getServerMoneyAvailable(host);
    const maxMoney = ns.getServerMaxMoney(host);
    const currentSecurity = ns.getServerSecurityLevel(host);
    const minSecurity = ns.getServerMinSecurityLevel(host);
    const hackTime = ns.getHackTime(host);
    const growTime = ns.getGrowTime(host);
    const weakenTime = ns.getWeakenTime(host);

    activeTarget = {
      name: host,
      currentMoney,
      maxMoney,
      currentSecurity,
      minSecurity,
      hackTime,
      growTime,
      weakenTime,
    };
  };

  const printStatus = () => {
    if (currentTask.type) {
      const {
        currentMoney, maxMoney, minSecurity, currentSecurity, name,
      } = activeTarget;
      const { duration, type, threadInfo } = currentTask;
      const { threads, threadsRemaining } = threadInfo;
      const timeLeft = Math.max(currentTask.expires - Date.now(), 0);
      const progress = Math.abs(100 - Math.round((100 * timeLeft) / duration));
      const progressString = `${progress}%`;
      const barSubstring = `${PBAR_INACTIVE_CHAR.repeat(PBAR_LENGTH)}`;
      const progressBar = `[${barSubstring}] ${progressString.padStart(4, ' ')}`;

      // Text
      const statusStrings = {
        task: { label: 'Task', sub: `${type} ${name}` },
        threads: {
          label: 'Threads',
          sub: `${threads - threadsRemaining} deployed | ${threadsRemaining} waiting`,
        },
        money: {
          label: 'Money',
          sub: `${ns.formatNumber(currentMoney)} / ${ns.formatNumber(maxMoney)}`,
        },
        security: {
          label: 'Security',
          sub: `${ns.formatNumber(currentSecurity)} / ${ns.formatNumber(minSecurity)}`,
        },
        baseTime: { label: 'Task Length', sub: `${ns.tFormat(duration || 0)}` },
        timeLeft: { label: 'Remaining', sub: `${ns.tFormat(timeLeft || 0)}` },
      };

      const barFill = () => {
        const barProgress = Math.round(progress / (100 / PBAR_LENGTH));
        let bar = progressBar;

        for (let i = 1; i <= barProgress; i += 1) {
          bar = bar.replace(PBAR_INACTIVE_CHAR, PBAR_ACTIVE_CHAR);
        }

        return bar;
      };

      ns.clearLog();
      ns.print(`> ${'-'.repeat(BASE_WIDTH - 2)}`);
      ns.print(
        `> ${statusStrings.task.label}${'.'.repeat(
          48 - statusStrings.task.label.length - statusStrings.task.sub.length,
        )}${statusStrings.task.sub}`,
      );
      ns.print(
        `> ${statusStrings.threads.label}${'.'.repeat(
          48 - statusStrings.threads.label.length - statusStrings.threads.sub.length,
        )}${statusStrings.threads.sub}`,
      );
      ns.print(
        `> ${statusStrings.money.label}${'.'.repeat(
          48 - statusStrings.money.label.length - statusStrings.money.sub.length,
        )}${statusStrings.money.sub}`,
      );
      ns.print(
        `> ${statusStrings.security.label}${'.'.repeat(
          48 - statusStrings.security.label.length - statusStrings.security.sub.length,
        )}${statusStrings.security.sub}`,
      );
      ns.print(
        `> ${statusStrings.baseTime.label}${'.'.repeat(
          48 - statusStrings.baseTime.label.length - statusStrings.baseTime.sub.length,
        )}${statusStrings.baseTime.sub}`,
      );
      ns.print(
        `> ${statusStrings.timeLeft.label}${'.'.repeat(
          48 - statusStrings.timeLeft.label.length - statusStrings.timeLeft.sub.length,
        )}${statusStrings.timeLeft.sub}`,
      );
      ns.print(`> ${barFill()}`);
      ns.print(`> ${'-'.repeat(BASE_WIDTH - 2)}`);
    }
  };

  /* ns.tail();
  ns.resizeTail(500, 255);
  ns.setTitle(`Deployer | ${ns.args[0]}`); */

  while (true) {
    const playerSettings = configPort.peek();
    const {
      interval, securityTolerance, sleepPadding, hackPercent,
    } = playerSettings.deployers;

    try {
      if (playerSettings.log.silenced) {
        if (ns.isLogEnabled('sleep')) {
          ns.disableLog('ALL');
        }
      } else if (!ns.isLogEnabled('sleep')) {
        ns.enableLog('ALL');
      }
    } catch (error) {
      ns.disableLog('ALL');
    }

    await ns.sleep(interval);

    if (!currentTask.active) {
      networkMap = JSON.parse(ns.read(gameConfig.files.netmap));
      let sleepTime = sleepPadding;
      let result;
      refreshTargetData();

      // TODO clean this up oh my god what the fuck
      if (activeTarget.currentSecurity > activeTarget.minSecurity * (1 + securityTolerance)) {
        // Weaken
        activeTarget.weakenThreadData = calcWeakenThreads(activeTarget);
        sleepTime += activeTarget.weakenTime;
        currentTask.type = 'Weaken';
        currentTask.scriptsRunning = [];
        result = distribute(
          gameConfig.scripts.weakenThread,
          activeTarget.weakenThreadData,
          playerSettings,
        );
      } else if (activeTarget.currentMoney < activeTarget.maxMoney) {
        // Grow
        activeTarget.growThreadData = calcGrowThreads(activeTarget);
        sleepTime += activeTarget.growTime;
        currentTask.type = 'Grow';
        currentTask.scriptsRunning = [];
        result = distribute(
          gameConfig.scripts.growThread,
          activeTarget.growThreadData,
          playerSettings,
        );
      } else {
        // Hack
        const hackMoneyPercent = hackPercent;
        const moneyTarget = Math.floor(activeTarget.maxMoney * hackMoneyPercent);
        activeTarget.hackThreadData = calcHackThreads(activeTarget, moneyTarget);
        sleepTime += activeTarget.hackTime;
        currentTask.type = 'Hack';
        currentTask.scriptsRunning = [];
        result = distribute(
          gameConfig.scripts.hackThread,
          activeTarget.hackThreadData,
          playerSettings,
        );
      }
      currentTask.target = activeTarget.name;
      currentTask.threadInfo = result;
      currentTask.duration = sleepTime;
      currentTask.expires = Date.now() + sleepTime;
      currentTask.active = true;
      Object.assign(currentTask, activeTarget);
      deployerPort.writeValue(activeTarget.name, currentTask);
    } else {
      // If our hacking level has increased, we may be able to restart
      // the current task at a lower duration than the current time left
      const taskTimeLeft = currentTask.expires - Date.now();
      let possibleTimeLeft = sleepPadding;
      switch (currentTask.type) {
        case 'Weaken':
          possibleTimeLeft += ns.getWeakenTime(currentTask.target);
          break;
        case 'Grow':
          possibleTimeLeft += ns.getGrowTime(currentTask.target);
          break;
        case 'Hack':
          possibleTimeLeft += ns.getHackTime(currentTask.target);
          break;
        default:
          possibleTimeLeft = Infinity;
          break;
      }

      if (possibleTimeLeft < taskTimeLeft) {
        // Kill all scripts from this deployer
        while (currentTask.scriptsRunning.length) {
          const script = currentTask.scriptsRunning.pop();
          ns.kill(script.pid);
        }
        currentTask.active = false;
      }

      if (currentTask.scriptsRunning.length) {
        currentTask.active = ns.isRunning(currentTask.scriptsRunning[0].pid);
      } else {
        currentTask.active = false;
      }
    }
    if (ns.getRunningScript().tailProperties) {
      printStatus();
    }
  }
}
