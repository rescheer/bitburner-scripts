import * as Ports from 'lib/Ports.js';
import {
  HOME,
  NETWORK_MAP,
  DISABLE_LOGGING,
  SCRIPTS,
  HACK_PERCENT,
  SLEEP_PADDING,
  LOG_LEVEL,
  TICK_INTERVAL,
  PBAR_LENGTH,
  PBAR_ACTIVE_CHAR,
  PBAR_INACTIVE_CHAR,
  BASE_WIDTH,
  SEC_TOLERANCE,
  MONEY_TOLERANCE,
  PORTS,
} from 'config.js';

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog(DISABLE_LOGGING);

  const statusPort = ns.getPortHandle(PORTS.status);
  const deployerPort = ns.getPortHandle(PORTS.deployer);
  var networkMap = {};
  var activeTarget = {};
  var currentTask = {
    active: false,
    target: '',
    type: '',
    duration: 0,
    expires: 0,
    threadInfo: {},
    scriptsRunning: [],
  };

  ns.atExit(() => {
    Ports.deletePortObjectKey(deployerPort, activeTarget.name);
    ns.closeTail();
  });

  const updateMissingRam = (val) => {
    const key = PORTS.statusKeys.missingRam;
    const oldValue = Ports.peekPortObject(statusPort, key);

    if (!oldValue) {
      Ports.updatePortObjectKey(statusPort, key, val);
    } else {
      if (oldValue < val) {
        Ports.updatePortObjectKey(statusPort, key, val);
      }
    }
  };

  const calcHackThreads = (nodeData) => {
    const { maxMoney, hackTime, name } = nodeData;
    const moneyTarget = maxMoney * HACK_PERCENT;
    const threadRam = ns.getScriptRam(SCRIPTS.hack, HOME);

    const threads = Math.ceil(ns.hackAnalyzeThreads(name, moneyTarget));
    const totalRam = threads * threadRam;
    const securityIncrease = ns.hackAnalyzeSecurity(threads, name);

    return { threads, threadRam, totalRam, time: hackTime, securityIncrease };
  };

  const calcGrowThreads = (nodeData) => {
    const { currentMoney, maxMoney, growTime, name } = nodeData;
    const deltaMult = maxMoney / currentMoney;
    const threadRam = ns.getScriptRam(SCRIPTS.grow, HOME);

    const threads = Math.ceil(ns.growthAnalyze(name, deltaMult));
    const totalRam = threads * threadRam;
    const securityIncrease = ns.growthAnalyzeSecurity(threads, name);

    return { threads, threadRam, totalRam, time: growTime, securityIncrease };
  };

  const calcWeakenThreads = (nodeData) => {
    const { currentSecurity, minSecurity, weakenTime } = nodeData;
    const securityDelta = currentSecurity - minSecurity;
    const threadRam = ns.getScriptRam(SCRIPTS.weaken, HOME);
    const weakenEffect = ns.weakenAnalyze(1);

    const threads = Math.ceil(securityDelta / weakenEffect);
    const totalRam = threads * threadRam;

    return { threads, threadRam, time: weakenTime, totalRam };
  };

  const distribute = (script, threadData) => {
    const { threads, threadRam } = threadData;
    var threadsRemaining = threads;

    // try all servers except for home
    for (let node in networkMap) {
      if (node !== HOME && networkMap[node].root) {
        if (threadsRemaining >= 1) {
          const maxRam = ns.getServerMaxRam(node);
          const usedRam = ns.getServerUsedRam(node);
          const freeRam = maxRam - usedRam;
          const possibleThreads = Math.floor(freeRam / threadRam);

          if (possibleThreads >= 1) {
            const actualThreads = Math.min(possibleThreads, threadsRemaining);

            ns.scp(script, node, HOME);
            const pid = ns.exec(script, node, actualThreads, activeTarget.name);
            if (LOG_LEVEL > 0) {
              ns.print(
                `${script}: Sent ${actualThreads}/${threadsRemaining} threads to ${node} (PID ${pid}).`
              );
            }
            threadsRemaining -= actualThreads;
            currentTask.scriptsRunning.push({
              node,
              pid,
              arg: activeTarget.name,
            });
          }
        } else {
          // No threads left to distro, so
          break;
        }
      }
    }

    // if we have threads left, dump them onto HOME
    // This is good for early game but could be problematic later
    if (threadsRemaining >= 1) {
      const maxRam = ns.getServerMaxRam(HOME);
      const usedRam = ns.getServerUsedRam(HOME);
      const freeRam = maxRam - usedRam;
      const possibleThreads = Math.floor(freeRam / threadRam);

      // Send low RAM signal, we don't want to use home Ram too much
      updateMissingRam(threadsRemaining * threadRam);

      if (possibleThreads >= 1) {
        const actualThreads = Math.min(possibleThreads, threadsRemaining);

        const pid = ns.exec(script, HOME, actualThreads, activeTarget.name);
        if (LOG_LEVEL > 0) {
          ns.print(
            `OVERFLOW: ${script}: Sent ${actualThreads}/${threadsRemaining} threads to ${HOME}`
          );
        }
        threadsRemaining -= actualThreads;
        currentTask.scriptsRunning.push({
          node: HOME,
          pid,
          arg: activeTarget.name,
        });
      }
    }

    // If we still have threads left, just skip them and request
    // the deficit RAM from the server manager
    if (threadsRemaining >= 1) {
      // Send low RAM signal
      updateMissingRam(threadsRemaining * threadRam);

      if (LOG_LEVEL > 0) {
        ns.print(
          `> Distributed ${
            threads - threadsRemaining
          } ${script} threads (${threadsRemaining}/${threads} remaining).`
        );
      }
    }

    if (LOG_LEVEL > 0) {
      ns.print(`> Disributed all ${script} threads (${threads} total).`);
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

    activeTarget.hackThreadData = calcHackThreads(activeTarget);
    activeTarget.growThreadData = calcGrowThreads(activeTarget);
    activeTarget.weakenThreadData = calcWeakenThreads(activeTarget);
  };

  const printStatus = () => {
    if (currentTask.type) {
      const { currentMoney, maxMoney, minSecurity, currentSecurity, name } =
        activeTarget;
      const { duration, type, threadInfo } = currentTask;
      const { threads, threadsRemaining } = threadInfo;
      const timeLeft = Math.max(currentTask.expires - Date.now(), 0);
      const progress = Math.abs(100 - Math.round((100 * timeLeft) / duration));
      const progressString = `${progress}%`;
      const barSubstring = `${PBAR_INACTIVE_CHAR.repeat(PBAR_LENGTH)}`;
      const progressBar = `[${barSubstring}] ${progressString.padStart(
        4,
        ' '
      )}`;

      // Text
      const statusStrings = {
        task: { label: 'Task', sub: `${type} ${name}` },
        threads: {
          label: 'Threads',
          sub: `${
            threads - threadsRemaining
          } deployed | ${threadsRemaining} waiting`,
        },
        money: {
          label: 'Money',
          sub: `${ns.formatNumber(currentMoney)} / ${ns.formatNumber(
            maxMoney
          )}`,
        },
        security: {
          label: 'Security',
          sub: `${ns.formatNumber(currentSecurity)} / ${ns.formatNumber(
            minSecurity
          )}`,
        },
        baseTime: { label: 'Task Length', sub: `${ns.tFormat(duration || 0)}` },
        timeLeft: { label: 'Remaining', sub: `${ns.tFormat(timeLeft || 0)}` },
      };

      const barFill = () => {
        const barProgress = Math.round(progress / (100 / PBAR_LENGTH));
        var bar = progressBar;

        for (let i = 1; i <= barProgress; i++) {
          bar = bar.replace(PBAR_INACTIVE_CHAR, PBAR_ACTIVE_CHAR);
        }

        return bar;
      };

      ns.clearLog();
      ns.print(`> ${'-'.repeat(BASE_WIDTH - 2)}`);
      ns.print(
        `> ${statusStrings.task.label}${'.'.repeat(
          48 - statusStrings.task.label.length - statusStrings.task.sub.length
        )}${statusStrings.task.sub}`
      );
      ns.print(
        `> ${statusStrings.threads.label}${'.'.repeat(
          48 -
            statusStrings.threads.label.length -
            statusStrings.threads.sub.length
        )}${statusStrings.threads.sub}`
      );
      ns.print(
        `> ${statusStrings.money.label}${'.'.repeat(
          48 - statusStrings.money.label.length - statusStrings.money.sub.length
        )}${statusStrings.money.sub}`
      );
      ns.print(
        `> ${statusStrings.security.label}${'.'.repeat(
          48 -
            statusStrings.security.label.length -
            statusStrings.security.sub.length
        )}${statusStrings.security.sub}`
      );
      ns.print(
        `> ${statusStrings.baseTime.label}${'.'.repeat(
          48 -
            statusStrings.baseTime.label.length -
            statusStrings.baseTime.sub.length
        )}${statusStrings.baseTime.sub}`
      );
      ns.print(
        `> ${statusStrings.timeLeft.label}${'.'.repeat(
          48 -
            statusStrings.timeLeft.label.length -
            statusStrings.timeLeft.sub.length
        )}${statusStrings.timeLeft.sub}`
      );
      ns.print(`> ${barFill()}`);
      ns.print(`> ${'-'.repeat(BASE_WIDTH - 2)}`);
    }
  };

  /* ns.tail();
  ns.resizeTail(500, 255);
  ns.setTitle(`Deployer | ${ns.args[0]}`); */

  while (true) {
    if (!currentTask.active) {
      networkMap = JSON.parse(ns.read(NETWORK_MAP));
      var sleepTime = SLEEP_PADDING;
      var result;
      refreshTargetData();

      if (
        activeTarget.currentSecurity >
        activeTarget.minSecurity * (1 + SEC_TOLERANCE)
      ) {
        // Weaken
        sleepTime += activeTarget.weakenTime;
        currentTask.type = 'Weaken';
        currentTask.scriptsRunning = [];
        result = distribute(SCRIPTS.weaken, activeTarget.weakenThreadData);
      } else if (
        activeTarget.currentMoney <
        activeTarget.maxMoney * (1 - MONEY_TOLERANCE)
      ) {
        // Grow
        sleepTime += activeTarget.growTime;
        currentTask.type = 'Grow';
        currentTask.scriptsRunning = [];
        result = distribute(SCRIPTS.grow, activeTarget.growThreadData);
      } else {
        // Hack
        sleepTime += activeTarget.hackTime;
        currentTask.type = 'Hack';
        currentTask.scriptsRunning = [];
        result = distribute(SCRIPTS.hack, activeTarget.hackThreadData);
      }
      currentTask.target = activeTarget.name;
      currentTask.threadInfo = result;
      currentTask.duration = sleepTime;
      currentTask.expires = Date.now() + sleepTime;
      currentTask.active = true;
      Ports.updatePortObjectKey(deployerPort, activeTarget.name, currentTask);
    } else {
      currentTask.active = ns.isRunning(currentTask.scriptsRunning[0].pid);

      if (currentTask.active) {
        // If our hacking level has increased, we may be able to restart
        // the current task at a lower duration than the current time left
        const taskTimeLeft = currentTask.expires - Date.now();
        var possibleTimeLeft = SLEEP_PADDING;
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
      }
    }
    if (ns.getRunningScript().tailProperties) {
      printStatus();
    }
    await ns.sleep(TICK_INTERVAL);
  }
}
