const Log = require('../../models/log');
var builder = require('xmlbuilder');


class Estimator {
    constructor(data) {
        this.reportedCases = data.reportedCases;

        this.daysToElapse = Estimator.calculateDaysToElapse(
            data.periodType,
            data.timeToElapse
        );

        this.factor = 2 ** Estimator.discardDecimal(this.daysToElapse / 3);

        this.totalHospitalBeds = data.totalHospitalBeds;

        this.avgDailyIncomePopulation = data.region.avgDailyIncomePopulation;
        this.avgDailyIncomeInUSD = data.region.avgDailyIncomeInUSD;
    }

    static calculateDaysToElapse(periodType, timeToElapse) {
        let toReturn = 0;
        switch (periodType) {
            case 'days':
                toReturn = timeToElapse;
                break;

            case 'months':
                toReturn = timeToElapse * 30;
                break;

            case 'weeks':
                toReturn = timeToElapse * 7;
                break;

            default:
                break;
        }
        return toReturn;
    }

    static discardDecimal(value) {
        return Math.trunc(value);
    }

    estimate(by) {
        const toReturn = {};

        const currentlyInfectedImpact = Estimator.discardDecimal(this.reportedCases * by);
        toReturn.currentlyInfected = currentlyInfectedImpact;

        const infectionsByRequestedTimeImpact = currentlyInfectedImpact * this.factor;
        toReturn.infectionsByRequestedTime = infectionsByRequestedTimeImpact;


        const severeCasesByRequestedTimeImpact = Estimator.discardDecimal(
            0.15 * infectionsByRequestedTimeImpact
        );
        toReturn.severeCasesByRequestedTime = severeCasesByRequestedTimeImpact;

        const availableBeds = 0.35 * this.totalHospitalBeds;
        toReturn.hospitalBedsByRequestedTime = Estimator.discardDecimal(
            availableBeds - severeCasesByRequestedTimeImpact
        );

        toReturn.casesForICUByRequestedTime = Estimator.discardDecimal(
            0.05 * infectionsByRequestedTimeImpact
        );


        toReturn.casesForVentilatorsByRequestedTime = Estimator.discardDecimal(
            0.02 * infectionsByRequestedTimeImpact
        );


        toReturn.dollarsInFlight = Estimator.discardDecimal(
            (
                infectionsByRequestedTimeImpact * this.avgDailyIncomePopulation * this.avgDailyIncomeInUSD
            ) / this.daysToElapse
        );

        return toReturn;
    }

    estimateImpact() {
        return this.estimate(10);
    }

    estimateSevereImpact() {
        return this.estimate(50);
    }
}


exports.estimate = async function (req, res,next) {
    console.log(req.body);

    const data = req.body;

    const estimator = new Estimator(data);

    const estimation = {
        data,
        impact: estimator.estimateImpact(),
        severeImpact: estimator.estimateSevereImpact()
    };
    console.log(estimation);

    if (req.params['format']=='xml'){
        var xml = builder.create(obj).end({ pretty: true});

        res.status(200).type('application/xml').send(xml);

    }

    res.status(200).json(data);

};

exports.logs = async function (req, res,next) {
    let logLines = [];
    const logs = await  Log.find({});

    logs.forEach(function (log) {
        let logLine = `${log.method}\t\t${log.path}\t\t${log.status}\t\t${log.time}`;
        logLines.push(logLine);
    });

    res.type('text/plain').send(logs.join('\n\r'));

};
